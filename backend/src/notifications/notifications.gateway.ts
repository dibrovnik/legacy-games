import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from './notifications.service';
import { Notification } from 'src/entities/notification';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@WebSocketGateway({ cors: true })
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSocketMap: Map<number, string> = new Map();

  constructor(private readonly notificationsService: NotificationsService) {}

  afterInit(server: Server) {
    console.log('WebSocket initialized');
  }

  handleConnection(client: Socket) {
    const userId = Number(client.handshake.query.userId);
    if (userId) {
      this.userSocketMap.set(userId, client.id);
    }
    console.log(`Client connected: ${client.id} (userId: ${userId})`);
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.userSocketMap.entries()) {
      if (socketId === client.id) {
        this.userSocketMap.delete(userId);
        break;
      }
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('get_notifications')
  async handleGetNotifications(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const notifications = await this.notificationsService.getUserNotifications(data.userId);
    client.emit('notifications', notifications);
  }

  async sendNotificationToUser(userId: number, notification: Notification) {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(`notification_${userId}`, notification);
    } else {
      console.log(`User ${userId} is not connected`);
    }
  }
}
