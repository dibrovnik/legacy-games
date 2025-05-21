import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BattleRoyalService } from './battleroyal.service';

// Перенесите эти константы в более подходящее место, например, в конфиг-сервис
// или используйте значения по умолчанию из CreateBattleRoyalDrawDto,
// если они не должны быть жестко закодированы здесь.
const DEFAULT_GRID_SIZE = 10; // Например, 10x10 = 100 чисел
const DEFAULT_ROUND_TIME_MS = 10000; // 10 секунд
// Эти фазы теперь означают ПРОЦЕНТ ОСТАЮЩИХСЯ чисел (например, 0.5 = 50% остаются)
const DEFAULT_REMOVAL_PHASES = [0.5, 0.3, 0.4, 0.8]; // Пример: 50% остаются, потом 30% от оставшихся, и т.д.

// Планирование создания новых тиражей
const DRAW_EVERY_MINUTES = 1; // Создавать новый тираж каждую минуту
const START_DELAY_MINUTES = 1; // Новый тираж начнется через 1 минуту после создания

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

@Injectable()
export class DrawSchedulerService {
  private readonly logger = new Logger(DrawSchedulerService.name);

  constructor(private readonly brService: BattleRoyalService) {}

  /**
   * Каждую `DRAW_EVERY_MINUTES` минут создаем новый тираж и игру.
   * Тираж будет запланирован на `START_DELAY_MINUTES` минут в будущем.
   */
  @Cron(CronExpression.EVERY_MINUTE) // Или CronExpression.EVERY_5_MINUTES, в зависимости от нужной частоты
  async createDrawAndGame() {
    const now = new Date();
    // Проверяем, наступила ли минута для создания нового тиража
    if (now.getMinutes() % DRAW_EVERY_MINUTES !== 0) {
      return;
    }

    try {
      // Создаем новый тираж
      const newDraw = await this.brService.createDraw({
        gridSize: DEFAULT_GRID_SIZE,
        roundTimeMs: DEFAULT_ROUND_TIME_MS,
        removalPhases: DEFAULT_REMOVAL_PHASES,
        startsAt: addMinutes(now, START_DELAY_MINUTES).toISOString(), // startsAt ожидает ISO-строку
      });

      // Создаем новую игру, связанную с этим тиражом
      const newGame = await this.brService.create({ drawId: newDraw.id });

      this.logger.log(`[Scheduler] New Draw ID: ${newDraw.id} and Game ID: ${newGame.id} created.`);
      this.logger.log(`[Scheduler] Game ${newGame.id} scheduled to start at: ${newDraw.startsAt}`);
    } catch (error) {
      this.logger.error(
        `[Scheduler] Failed to create new draw or game: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Проверяем активные игры каждые несколько секунд/минут и запускаем их, если время пришло.
   * Это важно, если сервис был перезапущен или если игра не запустилась сразу.
   * В новой логике `startGame` вызывается, когда игрок покупает билет,
   * но этот крон может служить "страховкой", чтобы игра все равно запустилась,
   * даже если игроков нет, но время начала тиража уже прошло.
   * Или же он может быть удален, если вы строго полагаетесь на запуск по покупке билета.
   */
  @Cron(CronExpression.EVERY_SECOND) // Проверять каждую секунду
  async checkAndStartGames() {
    try {
      const activeBR = await this.brService.getActiveBattleRoyal(); // Получить только активную игру
      if (activeBR && !activeBR.isGameActive && !activeBR.isGameOver) {
        const now = new Date();
        const drawStartsAt = new Date(activeBR.draw.startsAt); // Преобразуем строку в Date

        if (now >= drawStartsAt) {
          this.logger.log(
            `[Scheduler] Detected game ${activeBR.id} ready to start. Initiating game.`,
          );
          await this.brService.startGame(activeBR);
          // Здесь не нужно вызывать broadcastState напрямую, сервис сам справится
        }
      }
    } catch (error) {
      // NotFoundException от getActiveBattleRoyal - это нормально, просто нет активных игр.
      if (!(error instanceof NotFoundException)) {
        this.logger.error(
          `[Scheduler] Error checking/starting games: ${error.message}`,
          error.stack,
        );
      }
    }
  }
}
