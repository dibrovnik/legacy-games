// src/battleroyal/battleroyal.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Logger, forwardRef } from '@nestjs/common';
import { BattleRoyalService, GameStateUpdatedEvent } from './battleroyal.service';
import { SubmitNumberDto } from './dto/submit-number.dto';
import { JoinBattleRoyalDto } from './dto/join-battleroyal.dto';
import { OnEvent } from '@nestjs/event-emitter';

const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) ?? [];
@WebSocketGateway({
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/br',
})
export class BattleRoyalGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(BattleRoyalGateway.name);
  private userSocketMap = new Map<number, string>(); // userId -> socketId
  private gameParticipants = new Map<number, Set<number>>(); // battleRoyalId -> Set<userId>

  constructor(private readonly battleRoyalService: BattleRoyalService) {}

  afterInit(server: Server) {
    this.logger.log('BattleRoyalGateway initialized.');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id} to namespace ${client.nsp.name}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id} from namespace ${client.nsp.name}`);

    // Ищем userId по socketId, который отключился
    let disconnectedUserId: number | undefined;
    for (const [userId, socketId] of this.userSocketMap.entries()) {
      if (socketId === client.id) {
        disconnectedUserId = userId;
        break;
      }
    }

    if (disconnectedUserId) {
      // Удаляем userId из userSocketMap
      this.userSocketMap.delete(disconnectedUserId);
      this.logger.log(`Removed user ${disconnectedUserId} (socket ${client.id}) from socket map.`);

      // Удаляем userId из gameParticipants для всех игр
      for (const [battleRoyalId, userIds] of this.gameParticipants.entries()) {
        if (userIds.has(disconnectedUserId)) {
          userIds.delete(disconnectedUserId);
          this.logger.log(
            `Removed user ${disconnectedUserId} from game ${battleRoyalId} participants.`,
          );
          // Если игра больше не имеет участников, очищаем ее запись
          if (userIds.size === 0) {
            this.gameParticipants.delete(battleRoyalId);
            this.logger.log(`Cleaned up empty game ${battleRoyalId} in participants map.`);
          }
        }
      }
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, payload: { userId: number }) {
    this.logger.log(`Client ${client.id} (user ${payload.userId}) attempting to join room.`);
    try {
      const activeBR = await this.battleRoyalService.getActiveBattleRoyal();
      if (!activeBR) {
        client.emit('exception', { message: 'Нет активных игр Battle Royal. Попробуйте позже.' });
        return;
      }

      // Добавляем клиента в Socket.IO комнату, специфичную для пользователя
      client.join(`user_${payload.userId}`);
      this.logger.log(`Client ${client.id} joined Socket.IO room 'user_${payload.userId}'.`);

      // Store userId -> socketId mapping
      this.userSocketMap.set(payload.userId, client.id);
      this.logger.log(`Mapped user ${payload.userId} to socket ${client.id}.`);

      // Add user to the game's participants list
      if (!this.gameParticipants.has(activeBR.id)) {
        this.gameParticipants.set(activeBR.id, new Set());
      }
      this.gameParticipants.get(activeBR.id)!.add(payload.userId);
      this.logger.log(`User ${payload.userId} added to game ${activeBR.id} participants.`);

      // Register player in the service (e.g., create player entity if new)
      await this.battleRoyalService.handlePlayerConnection(payload.userId, activeBR.id);

      // Send initial state to the connecting client
      const gameState = await this.battleRoyalService.getGameStateForClient(
        activeBR.id,
        payload.userId,
      );
      client.emit('state', gameState);
      this.logger.log(`Initial state sent to client ${client.id} for user ${payload.userId}`);
    } catch (error) {
      this.logger.error(
        `Error handling joinRoom for client ${client.id} (user ${payload.userId}): ${error.message}`,
        error.stack,
      );
      client.emit('exception', {
        message: error.message || 'Failed to join game. Please try again.',
      });
    }
  }

  @SubscribeMessage('buyTicket')
  async handleBuyTicket(
    client: Socket,
    payload: { battleRoyalId: number; userId: number; selectedNumbers: number[] },
  ) {
    this.logger.log(
      `Client ${client.id} (user ${payload.userId}) attempting to buy ticket for game ${payload.battleRoyalId} with numbers: ${payload.selectedNumbers.join(', ')}`,
    );
    try {
      await this.battleRoyalService.buyTicket(payload);
      const gameState = await this.battleRoyalService.getGameStateForClient(
        payload.battleRoyalId,
        payload.userId,
      );
      client.emit('state', gameState); // Send immediate feedback to the client
      this.logger.log(
        `Ticket bought successfully for user ${payload.userId} in game ${payload.battleRoyalId}.`,
      );
    } catch (error) {
      this.logger.error(
        `Error handling buyTicket for client ${client.id} (user ${payload.userId}): ${error.message}`,
        error.stack,
      );
      client.emit('exception', {
        message: error.message || 'An error occurred while buying ticket.',
      });
    }
  }

  @OnEvent('game.state.updated')
  async handleGameStateUpdated(payload: GameStateUpdatedEvent) {
    this.logger.debug(
      `Received 'game.state.updated' event for Battle Royal ID: ${payload.battleRoyalId}`,
    );
    // Ensure the server instance is available
    if (!this.server) {
      // Нет необходимости проверять this.server.sockets
      this.logger.warn('Cannot broadcast state: WebSocket server not initialized.');
      return;
    }

    const userIdsInGame = this.gameParticipants.get(payload.battleRoyalId);

    if (userIdsInGame && userIdsInGame.size > 0) {
      for (const userId of Array.from(userIdsInGame)) {
        try {
          // Отправляем сообщение напрямую в комнату пользователя
          // Это более надежно, чем искать сокет по ID
          const gameState = await this.battleRoyalService.getGameStateForClient(
            payload.battleRoyalId,
            userId,
          );
          if (gameState) {
            this.server.to(`user_${userId}`).emit('state', gameState);
            this.logger.debug(
              `Broadcasted state for user ${userId} in game ${payload.battleRoyalId}`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Error fetching/emitting state for user ${userId} in game ${payload.battleRoyalId}: ${error.message}`,
          );
        }
      }
    } else {
      this.logger.debug(`No participants found for game ${payload.battleRoyalId} to update.`);
    }
  }

  @OnEvent('game.created')
  async handleGameCreated(payload: { battleRoyalId: number }) {
    this.logger.log(
      `New game created with ID: ${payload.battleRoyalId}. Triggering update for all clients.`,
    );
    if (this.server) {
      const activeBR = await this.battleRoyalService.getActiveBattleRoyal();
      if (activeBR) {
        // Отправляем всем клиентам в этом namespace, что есть новая активная игра
        this.server.emit('activeGameAvailable', {
          battleRoyalId: activeBR.id,
          startsAt: activeBR.draw.startsAt,
        });
        this.logger.log(`Emitted 'activeGameAvailable' to all connected sockets.`);
      }
    }
  }
}
