// src/battleroyal/battleroyal.service.ts
import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter'; // <--- Import EventEmitter2

import { BattleRoyal } from 'src/entities/battleroyal.entity';
import { BattleRoyalDraw } from 'src/entities/battleroyal-draw.entity';
import { BattleRoyalPlayer } from 'src/entities/battleroyal-player.entity';

import { CreateBattleRoyalDrawDto } from './dto/create-draw.dto';
import { CreateBattleRoyalDto } from './dto/create-battleroyal.dto';
import { BuyTicketDto } from './dto/buy-ticket.dto';
import { UsersService } from 'src/users/users.service';
import { BonusService } from 'src/bonus/bonus.service';

// ====================================================================================================
// Interfaces for Game State (frontend expects these)
// ====================================================================================================

export interface GameState {
  battleRoyalId: number;
  phase: number;
  eliminatedNumbers: number[];
  timeLeft: number;
  isGameOver: boolean;
  isGameActive: boolean; // Indicates if game is currently running rounds
  totalPlayersLeft: number; // Represents total numbers left on the grid
  userSelectedNumbers: number[]; // Numbers selected by *this specific user*
  gridSize: number;
  roundTimeMs: number;
  totalBank: number;
  totalPlayersWithTickets: number; // Total players who have bought tickets
  winningInfo: { userId: number | null; amount: number; percentage: number } | null;
  userTicket: { userId: number; selectedNumbers: number[]; hasTicket: boolean } | null;
}

// ====================================================================================================
// Event Data Interface (for broadcasting)
// ====================================================================================================
export interface GameStateUpdatedEvent {
  battleRoyalId: number;
  // We don't send the full GameState here, as it's user-specific.
  // Instead, we just signal that a general update occurred.
  // The Gateway will then fetch the user-specific state for each client.
}

// ====================================================================================================
// Service Implementation
// ====================================================================================================

@Injectable()
export class BattleRoyalService implements OnModuleInit {
  private readonly logger = new Logger(BattleRoyalService.name);
  private intervals = new Map<number, NodeJS.Timeout>(); // Stores setInterval references for each game

  constructor(
    @InjectRepository(BattleRoyal) private readonly brRepo: Repository<BattleRoyal>,
    @InjectRepository(BattleRoyalDraw) private readonly drawRepo: Repository<BattleRoyalDraw>,
    @InjectRepository(BattleRoyalPlayer) private readonly playerRepo: Repository<BattleRoyalPlayer>,
    private eventEmitter: EventEmitter2, // <--- Inject EventEmitter2
    private readonly userService: UsersService,
    private readonly bonusService: BonusService,
  ) {}

  private readonly TICKET_PRICE = process.env.BATTLEROYALE_TICKET_PRICE
    ? Number(process.env.BATTLEROYALE_TICKET_PRICE)
    : 0;

  private readonly TICKET_CASHBACK = process.env.BATTLEROYALE_TICKET_CASHBACK
    ? Number(process.env.BATTLEROYALE_TICKET_CASHBACK)
    : 0;

  onModuleInit() {
    this.logger.log('BattleRoyalService initialized.');
    this.resumeActiveGames();
  }

  private async resumeActiveGames() {
    this.logger.log('Attempting to resume active Battle Royal games...');
    const now = new Date();
    const activeGames = await this.brRepo.find({
      where: {
        isGameOver: false,
        isGameActive: true,
        draw: { startsAt: LessThanOrEqual(now) },
      },
      relations: ['draw', 'players'],
    });

    for (const br of activeGames) {
      if (!this.intervals.has(br.id)) {
        this.logger.log(
          `Resuming game ${br.id}. Current phase: ${br.currentPhase}, Time Left: ${br.timeLeft}`,
        );
        const interval = setInterval(() => this.tick(br.id), 1000);
        this.intervals.set(br.id, interval);
      }
    }
    this.logger.log(`Resumed ${activeGames.length} active games.`);
  }

  async createDraw(dto: CreateBattleRoyalDrawDto): Promise<BattleRoyalDraw> {
    const draw = this.drawRepo.create(dto);
    if (!dto.removalPhases || dto.removalPhases.length === 0) {
      throw new Error('removalPhases must be provided for the draw.');
    }
    for (const percentage of dto.removalPhases) {
      if (percentage <= 0 || percentage >= 1) {
        throw new Error(
          'Each value in removalPhases must be a percentage between 0 and 1 (exclusive).',
        );
      }
    }
    const savedDraw = await this.drawRepo.save(draw);
    this.logger.log(
      `New draw created with ID: ${savedDraw.id}, Round Time: ${dto.roundTimeMs}, Phases: ${dto.removalPhases.length}`,
    );
    return savedDraw;
  }

  async getActiveBattleRoyal(): Promise<BattleRoyal | null> {
    const now = new Date();
    const br = await this.brRepo.findOne({
      where: {
        isGameOver: false,
        draw: { startsAt: LessThanOrEqual(now) },
      },
      relations: ['draw', 'players'],
      order: { createdAt: 'DESC' },
    });
    return br;
  }

  async create(dto: CreateBattleRoyalDto): Promise<BattleRoyal> {
    const draw = await this.drawRepo.findOneBy({ id: dto.drawId });
    if (!draw) {
      throw new NotFoundException('Тираж не найден');
    }

    const br = this.brRepo.create({
      draw: draw,
      currentPhase: 0,
      eliminatedNumbers: [],
      timeLeft: draw.roundTimeMs,
      isGameOver: false,
      isGameActive: false,
      totalBank: 0,
      winningInfo: null,
    });
    const savedBr = await this.brRepo.save(br);
    this.logger.log(
      `New Battle Royal game created for draw ID: ${dto.drawId}, Game ID: ${savedBr.id}`,
    );
    // Emit event that a new game has been created, so Gateway can update any "waiting" clients
    this.eventEmitter.emit('game.created', { battleRoyalId: savedBr.id });
    return savedBr;
  }

  async handlePlayerConnection(userId: number, battleRoyalId: number): Promise<BattleRoyalPlayer> {
    const br = await this.brRepo.findOne({ where: { id: battleRoyalId }, relations: ['players'] });
    if (!br) {
      throw new NotFoundException(`Battle Royal game with ID ${battleRoyalId} not found.`);
    }

    let player = br.players.find((p) => p.userId === userId);

    if (!player) {
      player = this.playerRepo.create({
        battleRoyal: br,
        userId,
        selectedNumbers: [],
        hasTicket: false,
      });
      await this.playerRepo.save(player);
      this.logger.log(`New player ${userId} registered for Battle Royal game ${br.id}.`);
    } else {
      this.logger.log(`Player ${userId} reconnected to game ${br.id}.`);
    }
    // No need to save player again if only reconnecting, as socket ID is managed by gateway.
    return player;
  }

  async buyTicket(dto: BuyTicketDto): Promise<BattleRoyal> {
    const { battleRoyalId, userId, selectedNumbers } = dto;

    const br = await this.brRepo.findOne({
      where: { id: battleRoyalId },
      relations: ['draw', 'players'],
    });

    if (!br) {
      throw new NotFoundException('Игра Battle Royal не найдена.');
    }
    if (br.isGameActive || br.isGameOver) {
      throw new Error('Невозможно купить билет: игра уже началась или закончена.');
    }

    let player = br.players.find((p) => p.userId === userId);
    if (!player) {
      player = this.playerRepo.create({
        battleRoyal: br,
        userId,
        selectedNumbers: [],
        hasTicket: false,
      });
      await this.playerRepo.save(player);
      br.players.push(player);
    }

    const MAX_SELECTIONS = 6;
    if (selectedNumbers.length === 0 || selectedNumbers.length > MAX_SELECTIONS) {
      throw new Error(`Необходимо выбрать от 1 до ${MAX_SELECTIONS} чисел.`);
    }
    const allGridNumbers = Array.from(
      { length: br.draw.gridSize * br.draw.gridSize },
      (_, i) => i + 1,
    );
    if (selectedNumbers.some((num) => !allGridNumbers.includes(num))) {
      throw new Error('Выбраны недействительные числа.');
    }

    if (player.hasTicket) {
      this.logger.warn(
        `Player ${userId} already has a ticket for game ${battleRoyalId}. Updating numbers.`,
      );
    }

    player.selectedNumbers = selectedNumbers;
    player.hasTicket = true;
    const fullPrice = this.TICKET_PRICE;
    const cashback = Math.floor(fullPrice * this.TICKET_CASHBACK);
    await this.userService.debitRub(userId, fullPrice);
    this.bonusService.awardFixedAmount(userId, cashback);
    await this.playerRepo.save(player);

    br.totalBank += this.TICKET_PRICE;
    const updatedBr = await this.brRepo.save(br); // Save the updated BR entity

    this.logger.log(
      `User ${userId} bought ticket for game ${battleRoyalId} with numbers: ${selectedNumbers.join(', ')}. Current total bank: ${updatedBr.totalBank}`,
    );

    const playersWithTickets = updatedBr.players.filter((p) => p.hasTicket).length;
    if (!updatedBr.isGameActive && playersWithTickets >= 1) {
      await this.startGame(updatedBr); // startGame also emits an event
    } else {
      // Emit state update even if game doesn't start, as totalBank or user ticket changed
      this.eventEmitter.emit('game.state.updated', { battleRoyalId: updatedBr.id });
    }

    return updatedBr;
  }

  async getGameStateForClient(battleRoyalId: number, userId: number | null): Promise<GameState> {
    const br = await this.brRepo.findOne({
      where: { id: battleRoyalId },
      relations: ['draw', 'players'],
    });
    if (!br) {
      this.logger.warn(`Game state requested for non-existent BR ID: ${battleRoyalId}`);
      throw new NotFoundException('Игра Battle Royal не найдена');
    }
    const playersWithTickets = br.players.filter((p) => p.hasTicket).length;

    let userTicket: { userId: number; selectedNumbers: number[]; hasTicket: boolean } | null = null;
    const player = br.players.find((p) => p.userId === userId);
    if (player && player.hasTicket) {
      userTicket = {
        userId: player.userId,
        selectedNumbers: player.selectedNumbers,
        hasTicket: player.hasTicket,
      };
    }

    console.log(
      `Game state for BR ID ${battleRoyalId} requested by user ${userId}. Players with tickets: ${playersWithTickets}`,
    );

    const totalNumbersOnGrid = br.draw.gridSize * br.draw.gridSize;
    const numbersLeftOnGrid = totalNumbersOnGrid - br.eliminatedNumbers.length;

    return {
      battleRoyalId: br.id,
      phase: br.currentPhase,
      eliminatedNumbers: br.eliminatedNumbers,
      timeLeft: br.timeLeft,
      isGameOver: br.isGameOver,
      isGameActive: br.isGameActive,
      totalPlayersLeft: numbersLeftOnGrid,
      userSelectedNumbers: userTicket?.selectedNumbers || [],
      gridSize: br.draw.gridSize,
      totalPlayersWithTickets: playersWithTickets,
      roundTimeMs: br.draw.roundTimeMs,
      totalBank: parseFloat(br.totalBank as any), // Ensure totalBank is a number for the frontend
      winningInfo: br.winningInfo
        ? {
            ...br.winningInfo,
            amount: parseFloat(br.winningInfo.amount as any), // Ensure winning amount is a number
          }
        : null,
      userTicket: userTicket,
    };
  }

  async startGame(br: BattleRoyal): Promise<BattleRoyal> {
    if (this.intervals.has(br.id) || br.isGameActive || br.isGameOver) {
      this.logger.warn(
        `Attempted to start game ${br.id} that is already active, over, or has an interval.`,
      );
      return br;
    }

    const playersWithTickets = br.players.filter((p) => p.hasTicket);
    if (playersWithTickets.length === 0) {
      this.logger.warn(`Game ${br.id} cannot start: No players have bought tickets.`);
      return br;
    }

    br.isGameActive = true;
    br.timeLeft = br.draw.roundTimeMs;
    const savedBr = await this.brRepo.save(br); // Save the updated BR entity

    this.logger.log(`[BR Service] Starting game ${br.id}. Initial timeLeft: ${savedBr.timeLeft}`);

    const interval = setInterval(() => this.tick(br.id), 1000);
    this.intervals.set(br.id, interval);

    // Emit event that game state has been updated (game started)
    this.eventEmitter.emit('game.state.updated', { battleRoyalId: savedBr.id });
    return savedBr;
  }

  private async tick(id: number) {
    const br = await this.brRepo.findOne({
      where: { id },
      relations: ['draw', 'players'],
    });

    if (!br || br.isGameOver || !br.isGameActive) {
      if (this.intervals.has(id)) {
        clearInterval(this.intervals.get(id));
        this.intervals.delete(id);
        this.logger.log(
          `[BR Service] Stopped game ${id} tick interval. Game Over: ${br?.isGameOver}, Active: ${br?.isGameActive}`,
        );
      }
      return;
    }

    br.timeLeft -= 1000;

    if (br.timeLeft <= 0) {
      this.logger.log(
        `[BR Service] Game ${br.id} time is up for phase ${br.currentPhase}. Advancing phase.`,
      );
      if (this.intervals.has(id)) {
        clearInterval(this.intervals.get(id));
        this.intervals.delete(id);
      }
      await this.advancePhase(br); // advancePhase also emits an event
    } else {
      await this.brRepo.save(br);
      // Emit event for every tick, so Gateway can update frontend
      this.eventEmitter.emit('game.state.updated', { battleRoyalId: br.id });
    }
  }

  private async advancePhase(br: BattleRoyal): Promise<BattleRoyal> {
    const { draw } = br;
    const allGridNumbers = Array.from({ length: draw.gridSize * draw.gridSize }, (_, i) => i + 1);

    const currentlyRemainingNumbers = allGridNumbers.filter(
      (n) => !br.eliminatedNumbers.includes(n),
    );

    const percentageToKeep = draw.removalPhases[br.currentPhase];
    if (typeof percentageToKeep === 'undefined') {
      this.logger.log(`[BR Service] No more removal phases for game ${br.id}. Ending game.`);
      await this.endGame(br);
      return br;
    }

    const numbersToKeepCount = Math.ceil(currentlyRemainingNumbers.length * percentageToKeep);
    const numbersToKeep = this.getRandomElements(currentlyRemainingNumbers, numbersToKeepCount);

    const newlyEliminated = currentlyRemainingNumbers.filter((num) => !numbersToKeep.includes(num));
    br.eliminatedNumbers.push(...newlyEliminated);

    for (const player of br.players) {
      if (player.hasTicket && player.finalStageReached === null) {
        const playerNumbersStillInGame = player.selectedNumbers.some(
          (num) => !br.eliminatedNumbers.includes(num),
        );
        if (!playerNumbersStillInGame) {
          player.finalStageReached = br.currentPhase;
          await this.playerRepo.save(player);
          this.logger.log(
            `Player ${player.userId}'s numbers ${player.selectedNumbers.join(', ')} were eliminated in phase ${br.currentPhase}.`,
          );
        }
      }
    }

    br.currentPhase++;
    br.timeLeft = draw.roundTimeMs;

    const totalNumbersAfterElimination = allGridNumbers.length - br.eliminatedNumbers.length;

    if (totalNumbersAfterElimination <= 1 || br.currentPhase >= draw.removalPhases.length) {
      this.logger.log(`[BR Service] Game ${br.id} will end after this phase.`);
      await this.endGame(br);
    } else {
      const updatedBr = await this.brRepo.save(br);
      this.intervals.set(
        br.id,
        setInterval(() => this.tick(br.id), 1000),
      );
      // Emit event that game state has been updated (phase advanced)
      this.eventEmitter.emit('game.state.updated', { battleRoyalId: updatedBr.id });
    }
    return br;
  }

  private async endGame(br: BattleRoyal): Promise<BattleRoyal> {
    if (br.isGameOver) {
      this.logger.warn(`Attempted to end game ${br.id} which is already over.`);
      return br;
    }

    this.logger.log(`[BR Service] Ending game ${br.id}.`);
    br.isGameOver = true;
    br.isGameActive = false;

    if (this.intervals.has(br.id)) {
      clearInterval(this.intervals.get(br.id));
      this.intervals.delete(br.id); // Fixed typo: should be id, not br.id
    }

    const allGridNumbers = Array.from(
      { length: br.draw.gridSize * br.draw.gridSize },
      (_, i) => i + 1,
    );
    const winningNumbersCandidates = allGridNumbers.filter(
      (n) => !br.eliminatedNumbers.includes(n),
    );
    const finalWinningNumber =
      winningNumbersCandidates.length === 1 ? winningNumbersCandidates[0] : null;

    let winningPlayerId: number | null = null;
    let winningAmount = 0;
    let winningPercentage = 0;

    if (finalWinningNumber !== null) {
      for (const player of br.players) {
        if (player.hasTicket && player.selectedNumbers.includes(finalWinningNumber)) {
          winningPlayerId = player.userId;
          player.finalStageReached = br.currentPhase;
          await this.playerRepo.save(player);

          const survivedPhases = br.currentPhase;

          if (survivedPhases === 0) winningPercentage = 0;
          else if (survivedPhases === 1) winningPercentage = 50;
          else if (survivedPhases === 2) winningPercentage = 60;
          else if (survivedPhases === 3) winningPercentage = 65;
          else if (survivedPhases >= 4) winningPercentage = 70;

          winningAmount = br.totalBank * (winningPercentage / 100);
          await this.userService.creditRub(player.userId, winningAmount);
          this.logger.log(
            `Player ${player.userId} won Battle Royal ${br.id} with number ${finalWinningNumber}! Winning amount: ${winningAmount}, percentage: ${winningPercentage}%`,
          );
          break;
        }
      }
    } else {
      this.logger.warn(`Game ${br.id} ended without a single winning number.`);
    }

    br.winningInfo = {
      userId: winningPlayerId,
      amount: winningAmount,
      percentage: winningPercentage,
    };

    const updatedBr = await this.brRepo.save(br);
    this.eventEmitter.emit('game.state.updated', { battleRoyalId: updatedBr.id }); // Emit after game ends

    setTimeout(async () => {
      this.logger.log(`Preparing for next game after ${updatedBr.id} ended.`);
      try {
        const latestDraw = await this.drawRepo.findOne({ order: { createdAt: 'DESC' } });
        if (latestDraw) {
          // Ensure a new game is created here
          await this.create({ drawId: latestDraw.id });
          this.logger.log(`New BattleRoyal game created for draw ${latestDraw.id}.`);
        } else {
          this.logger.error('No draws found to create a new Battle Royal game.');
        }
      } catch (error) {
        this.logger.error(`Error creating new Battle Royal game: ${error.message}`);
      }
    }, 15000); // 15 seconds cooldown

    return updatedBr;
  }

  private getRandomElements<T>(arr: T[], count: number): T[] {
    if (count <= 0 || arr.length === 0) return [];
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }
}
