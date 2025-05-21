// src/minesweeper/minesweeper.service.ts

import { Injectable } from '@nestjs/common';
import { Room, Player } from './minesweeper.interface';
import { BonusService } from 'src/bonus/bonus.service';

@Injectable()
export class MinesweeperService {
  private rooms: Map<string, Room> = new Map();

  private readonly CREATE_COST = process.env.MINESWEEPER_COST
    ? Number(process.env.MINESWEEPER_COST)
    : 0;
  private readonly AWARD = process.env.MINESWEEPER_AWARD
    ? Number(process.env.MINESWEEPER_AWARD)
    : 0;

  constructor(private readonly bonusService: BonusService) {}

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private generateField(size: number, minesCount: number): { field: number[]; mines: number[] } {
    const field = Array(size).fill(0);
    const minePositions: Set<number> = new Set();
    while (minePositions.size < minesCount) {
      const pos = Math.floor(Math.random() * size);
      minePositions.add(pos);
    }
    minePositions.forEach((pos) => (field[pos] = 1));
    return { field, mines: Array.from(minePositions) };
  }

  private aiSelectCell(room: Room, openedCells: Set<number>): number {
    const availableCells = room.field
      .map((cell, index) => ({ cell, index }))
      .filter(({ index }) => !openedCells.has(index))
      .map(({ index }) => index);

    if (availableCells.length === 0) {
      return Math.floor(Math.random() * room.field.length);
    }
    return availableCells[Math.floor(Math.random() * availableCells.length)];
  }

  createRoom(
    playerId: string,
    userId: number,
    firstName: string,
    lastName: string,
    playWithAI: boolean,
  ): Room {
    const roomId = this.generateRoomId();
    const roomName = `${firstName} ${lastName}`;

    const player1: Player = {
      id: playerId,
      userId: userId,
      firstName: firstName,
      lastName: lastName,
      isReady: true,
      isAI: false,
    };

    const { field, mines } = this.generateField(25, 5);

    const room: Room = {
      id: roomId,
      name: roomName,
      players: [player1],
      status: 'waiting',
      field: field,
      mines: mines,
      playerSelection: null,
      opponentSelection: null,
      openedCells: new Set<number>(),
    };

    if (playWithAI) {
      const aiPlayer: Player = {
        id: 'AI_PLAYER',
        userId: 0,
        firstName: 'AI',
        lastName: '',
        isReady: true,
        isAI: true,
      };
      room.players.push(aiPlayer);
      room.status = 'in_game';
      console.log(`[SERVICE] Room ${roomId} created with AI. Initial status: ${room.status}`);
    }
    this.rooms.set(roomId, room);
    console.log(
      `[SERVICE] Room ${roomId} (${room.name}) stored. Players:`,
      room.players.map((p) => `${p.firstName} ${p.lastName}`),
    );
    return room;
  }

  joinRoom(
    roomId: string,
    playerId: string,
    userId: number,
    firstName: string,
    lastName: string,
  ): Room | null {
    this.bonusService.spendFixed(userId, this.CREATE_COST);

    const room = this.rooms.get(roomId);
    if (!room) {
      console.log(`[SERVICE] joinRoom: Room ${roomId} not found.`);
      return null;
    }

    if (room.players.some((p) => p.userId === userId)) {
      console.log(
        `[SERVICE] User ${firstName} ${lastName} (ID: ${userId}) already in room ${roomId}.`,
      );
      return null;
    }

    if (room.players.length < 2 && room.status === 'waiting') {
      const player2: Player = {
        id: playerId,
        userId: userId,
        firstName: firstName,
        lastName: lastName,
        isReady: true,
        isAI: false,
      };
      room.players.push(player2);
      room.status = 'in_game';
      console.log(`[SERVICE] Player ${firstName} ${lastName} joined room ${roomId}`);
      return room;
    }
    console.log(`[SERVICE] joinRoom: Room ${roomId} is full or not in waiting status.`);
    return null;
  }

  startGame(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.status = 'in_game';
      room.playerSelection = null;
      room.opponentSelection = null;
      room.openedCells = new Set<number>();
      console.log(`[SERVICE] Game started in room ${roomId}. openedCells reset.`);
    }
  }

  selectCell(
    roomId: string,
    playerId: string,
    cellIndex: number,
  ): { room: Room | null; result: string | null } {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'in_game') {
      console.log(
        `[SERVICE] selectCell: Invalid room (${roomId}) or game not in_game (${room?.status}).`,
      );
      return { room: null, result: null };
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      console.log(`[SERVICE] selectCell: Player ${playerId} not found in room ${roomId}.`);
      return { room: null, result: null };
    }

    if (room.openedCells.has(cellIndex)) {
      console.log(
        `[SERVICE] Cell ${cellIndex} already opened. Player ${player.firstName} tried to select.`,
      );
      return { room, result: null };
    }

    const isPlayer1 = player.id === room.players[0].id;
    const isPlayer2 = room.players.length > 1 && player.id === room.players[1].id;

    if (isPlayer1) {
      if (room.playerSelection !== null && !player.isAI) {
        console.log(
          `[SERVICE] Player1 (${player.firstName}) already selected ${room.playerSelection}.`,
        );
        return { room, result: null };
      }
      room.playerSelection = cellIndex;
      console.log(`[SERVICE] Player ${player.firstName} (Player1) selected cell ${cellIndex}.`);
    } else if (isPlayer2) {
      if (room.opponentSelection !== null && !player.isAI) {
        console.log(
          `[SERVICE] Player2 (${player.firstName}) already selected ${room.opponentSelection}.`,
        );
        return { room, result: null };
      }
      room.opponentSelection = cellIndex;
      console.log(`[SERVICE] Player ${player.firstName} (Player2/AI) selected cell ${cellIndex}.`);
    } else {
      console.warn(
        `[SERVICE] Player ${player.firstName} (${playerId}) selection failed: role not determined.`,
      );
      return { room, result: null };
    }

    const aiPlayer = room.players.find((p) => p.isAI);
    if (
      aiPlayer &&
      player.id !== aiPlayer.id &&
      room.playerSelection !== null &&
      room.opponentSelection === null
    ) {
      console.log(
        `[SERVICE] User (${player.firstName}) made selection. AI (${aiPlayer.firstName}) is about to make a move.`,
      );
      const aiSelectedCell = this.aiSelectCell(room, room.openedCells);
      room.opponentSelection = aiSelectedCell; // ИИ делает свой ход
      console.log(
        `[SERVICE] AI selected cell ${aiSelectedCell}. Current selections: User ${room.playerSelection}, AI ${room.opponentSelection}`,
      );
    }

    if (room.playerSelection !== null && room.opponentSelection !== null) {
      console.log(
        `[SERVICE] Both players selected. User: ${room.playerSelection}, Opponent: ${room.opponentSelection}`,
      );

      room.openedCells.add(room.playerSelection);
      room.openedCells.add(room.opponentSelection);
      console.log(`[SERVICE] Opened Cells after round: ${Array.from(room.openedCells)}`);

      const userHitMine = room.mines.includes(room.playerSelection);
      const opponentHitMine = room.mines.includes(room.opponentSelection);

      let result: string;

      if (userHitMine && opponentHitMine) {
        result = 'both_lose';
        room.status = 'finished';
      } else if (userHitMine) {
        result = 'user_loses';
        room.status = 'finished';
      } else if (opponentHitMine) {
        result = 'user_wins';
        this.bonusService.awardFixedAmount(player.userId, this.AWARD);
        room.status = 'finished';
      } else {
        result = 'round_repeat';
        room.playerSelection = null;
        room.opponentSelection = null;
      }

      console.log(`[SERVICE] Round result: ${result}. Room status: ${room.status}`);
      return { room, result };
    }

    console.log(`[SERVICE] Waiting for second player's selection in room ${roomId}.`);
    return { room, result: null };
  }

  handlePlayerDisconnect(disconnectedPlayerId: string): void {
    this.rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex((p) => p.id === disconnectedPlayerId);
      if (playerIndex !== -1) {
        const disconnectedPlayer = room.players[playerIndex];
        console.log(
          `[SERVICE] Player ${disconnectedPlayer.firstName} ${disconnectedPlayer.lastName} (Socket ID: ${disconnectedPlayerId}) disconnected from room ${roomId}.`,
        );

        if (room.players.some((p) => p.isAI) && disconnectedPlayer.userId !== 0) {
          console.log(
            `[SERVICE] Room ${roomId}: Human player disconnected from AI game. AI wins by default.`,
          );
          room.status = 'finished';
          this.removeRoom(roomId);
        } else if (room.players.length === 2 && !room.players.some((p) => p.isAI)) {
          console.log(
            `[SERVICE] Room ${roomId}: One of two real players disconnected. Game ended.`,
          );
          room.status = 'finished';
          this.removeRoom(roomId);
        } else if (room.players.length === 1 && room.status === 'waiting') {
          console.log(`[SERVICE] Room ${roomId}: Single player disconnected from waiting room.`);
          this.removeRoom(roomId);
        }
      }
    });
  }

  getAvailableRooms(): Room[] {
    return Array.from(this.rooms.values()).filter(
      (room) =>
        room.status === 'waiting' && room.players.length < 2 && !room.players.some((p) => p.isAI), // Комнаты ожидания, неполные и без ИИ
    );
  }

  getRoomById(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  removeRoom(roomId: string): void {
    this.rooms.delete(roomId);
    console.log(`[SERVICE] Room ${roomId} removed.`);
  }
}
