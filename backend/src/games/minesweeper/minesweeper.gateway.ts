import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MinesweeperService } from './minesweeper.service';
import { Room } from './minesweeper.interface';

const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) ?? [];

@WebSocketGateway({
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class MinesweeperGateway implements OnGatewayDisconnect {
  constructor(private readonly minesweeperService: MinesweeperService) {}

  @WebSocketServer() server: Server;

  private sendRoomState(
    client: Socket | Server,
    room: Room,
    eventName: string,
    additionalData?: any,
  ) {
    const roomToSend = { ...room, openedCells: Array.from(room.openedCells) };
    if (additionalData) {
      client.emit(eventName, { ...additionalData, room: roomToSend });
    } else {
      client.emit(eventName, roomToSend);
    }
  }

  private broadcastRoomState(roomId: string, room: Room, eventName: string, additionalData?: any) {
    const roomToSend = { ...room, openedCells: Array.from(room.openedCells) };
    if (additionalData) {
      this.server.to(roomId).emit(eventName, { ...additionalData, room: roomToSend });
    } else {
      this.server.to(roomId).emit(eventName, roomToSend);
    }
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @MessageBody()
    data: { userId: number; firstName: string; lastName: string; playWithAI: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `[GATEWAY] Create room request from ${data.firstName} ${data.lastName} (User ID: ${data.userId})`,
    );
    const room = this.minesweeperService.createRoom(
      client.id,
      data.userId,
      data.firstName,
      data.lastName,
      data.playWithAI,
    );
    client.join(room.id);
    this.sendRoomState(client, room, 'roomCreated');

    if (data.playWithAI) {
      this.minesweeperService.startGame(room.id);
      const updatedRoom = this.minesweeperService.getRoomById(room.id);
      if (updatedRoom) {
        console.log(
          `[GATEWAY] Emitting 'gameStarted' for room ${room.id} (AI game). Room status: ${updatedRoom.status}`,
        );
        this.broadcastRoomState(room.id, updatedRoom, 'gameStarted');
      } else {
        console.error(`[GATEWAY] Failed to get updated room after startGame for AI.`);
      }
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; userId: number; firstName: string; lastName: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `[GATEWAY] Join room request for ${data.roomId} from ${data.firstName} ${data.lastName} (User ID: ${data.userId})`,
    );
    const room = this.minesweeperService.joinRoom(
      data.roomId,
      client.id,
      data.userId,
      data.firstName,
      data.lastName,
    );
    if (room) {
      client.join(room.id);
      this.broadcastRoomState(room.id, room, 'playerJoined');
      if (
        room.players.length === 2 &&
        room.status === 'in_game' &&
        !room.players.some((p) => p.isAI)
      ) {
        this.minesweeperService.startGame(room.id);
        const updatedRoom = this.minesweeperService.getRoomById(room.id);
        if (updatedRoom) {
          this.broadcastRoomState(room.id, updatedRoom, 'gameStarted');
        }
      }
    } else {
      client.emit('error', { message: 'Failed to join room: Room not found or full.' });
    }
  }

  @SubscribeMessage('selectCell')
  handleSelectCell(
    @MessageBody() data: { roomId: string; cellIndex: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `[GATEWAY] Player ${client.id} selected cell ${data.cellIndex} in room ${data.roomId}`,
    );
    const { room, result } = this.minesweeperService.selectCell(
      data.roomId,
      client.id,
      data.cellIndex,
    );
    if (room) {
      if (result) {
        this.broadcastRoomState(room.id, room, 'roundResult', { result });

        if (room.status === 'finished') {
          this.broadcastRoomState(room.id, room, 'gameOver');
        } else {
          this.broadcastRoomState(room.id, room, 'newRound');
        }
      } else {
        this.server.to(room.id).emit('playerSelected', {
          roomId: room.id,
          playerId: client.id,
          cellIndex: data.cellIndex,
        });
      }
    } else {
      client.emit('error', { message: 'Invalid room or game not in progress.' });
    }
  }

  @SubscribeMessage('getAvailableRooms')
  handleGetAvailableRooms(@ConnectedSocket() client: Socket) {
    const rooms = this.minesweeperService.getAvailableRooms();
    const roomsToSend = rooms.map((room) => ({
      ...room,
      openedCells: Array.from(room.openedCells),
    }));
    client.emit('availableRooms', roomsToSend);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.minesweeperService.handlePlayerDisconnect(client.id);
    this.server.emit(
      'availableRooms',
      this.minesweeperService
        .getAvailableRooms()
        .map((room) => ({ ...room, openedCells: Array.from(room.openedCells) })),
    );
  }
}
