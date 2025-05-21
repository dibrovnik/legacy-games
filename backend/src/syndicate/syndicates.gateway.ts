import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SyndicatesService } from './syndicates.service';
import { NotFoundException, BadRequestException, UseFilters, Logger } from '@nestjs/common';
import { WsExceptionFilter } from './filters/ws-exception.filter';

const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) ?? [];

@UseFilters(new WsExceptionFilter())
@WebSocketGateway({
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class SyndicatesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(SyndicatesGateway.name);

  constructor(private readonly syndicatesService: SyndicatesService) {}

  handleConnection(@ConnectedSocket() client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('createSyndicate')
  async handleCreateSyndicate(
    @MessageBody() data: { hostId: number; drawId: number; maxMembers: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Received createSyndicate from user ${data.hostId} for draw ${data.drawId}`);
    try {
      const syndicate = await this.syndicatesService.createSyndicate(
        data.hostId,
        data.drawId,
        data.maxMembers,
      );

      await client.join(syndicate.id.toString());
      this.logger.log(`User ${data.hostId} created and joined syndicate room: ${syndicate.id}`);

      const fullSyndicateDetails = await this.syndicatesService.getSyndicateDetails(syndicate.id);
      client.emit('syndicateCreated', fullSyndicateDetails);

      this.server.emit('syndicatesUpdated');

      return fullSyndicateDetails;
    } catch (error) {
      this.logger.error(`Error creating syndicate: ${error.message}`);
      throw error;
    }
  }

  @SubscribeMessage('inviteToSyndicate')
  async handleInviteToSyndicate(
    @MessageBody() data: { syndicateId: number; requesterId: number; friendId: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `Received inviteToSyndicate for syndicate ${data.syndicateId} by user ${data.requesterId} to friend ${data.friendId}`,
    );
    try {
      const message = await this.syndicatesService.invite(
        data.syndicateId,
        data.requesterId,
        data.friendId,
      );

      this.logger.log(message);
      client.emit('inviteSent', { success: true, message: message });

      return { success: true, message: message };
    } catch (error) {
      this.logger.error(`Error inviting to syndicate: ${error.message}`);
      throw error;
    }
  }

  @SubscribeMessage('joinSyndicate')
  async handleJoinSyndicate(
    @MessageBody() data: { syndicateId: number; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `Received joinSyndicate for syndicate ${data.syndicateId} by user ${data.userId}`,
    );
    try {
      const member = await this.syndicatesService.join(data.syndicateId, data.userId);

      await client.join(data.syndicateId.toString());
      this.logger.log(`User ${data.userId} joined syndicate room: ${data.syndicateId}`);

      const updatedSyndicate = await this.syndicatesService.getSyndicateDetails(data.syndicateId);
      if (updatedSyndicate) {
        this.server.to(data.syndicateId.toString()).emit('memberJoined', updatedSyndicate);

        if (updatedSyndicate.status === 'WAITING_FOR_READY') {
          this.server
            .to(data.syndicateId.toString())
            .emit('syndicateReadyToProceed', updatedSyndicate);
        }
      }

      this.server.emit('syndicatesUpdated');

      return member;
    } catch (error) {
      this.logger.error(`Error joining syndicate: ${error.message}`);
      throw error;
    }
  }

  @SubscribeMessage('markSyndicateReady')
  async handleMarkSyndicateReady(
    @MessageBody() data: { syndicateId: number; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `Received markSyndicateReady for syndicate ${data.syndicateId} by user ${data.userId}`,
    );
    try {
      await this.syndicatesService.ready(data.syndicateId, data.userId);

      const updatedSyndicate = await this.syndicatesService.getSyndicateDetails(data.syndicateId);
      if (updatedSyndicate) {
        this.server
          .to(data.syndicateId.toString())
          .emit('syndicateStatusUpdated', updatedSyndicate);
        if (updatedSyndicate.status === 'BUYING') {
          this.server
            .to(data.syndicateId.toString())
            .emit('syndicateReadyForBuying', updatedSyndicate);
        }
      }
      return { success: true, message: 'Syndicate marked as ready for buying.' };
    } catch (error) {
      this.logger.error(`Error marking syndicate ready: ${error.message}`);
      throw error;
    }
  }

  @SubscribeMessage('buySyndicateTickets')
  async handleBuySyndicateTickets(
    @MessageBody() data: { syndicateId: number; userId: number; selections: number[][] },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `Received buySyndicateTickets for syndicate ${data.syndicateId} by user ${data.userId} with ${data.selections.length} tickets`,
    );
    try {
      await this.syndicatesService.buyTickets(data.syndicateId, data.userId, data.selections);

      const updatedSyndicate = await this.syndicatesService.getSyndicateDetails(data.syndicateId);
      if (updatedSyndicate) {
        this.server.to(data.syndicateId.toString()).emit('ticketsBought', updatedSyndicate);
        if (updatedSyndicate.status === 'PARTICIPATING' || updatedSyndicate.status === 'FAILED') {
          this.server
            .to(data.syndicateId.toString())
            .emit('syndicateStatusFinalized', updatedSyndicate);
        }
      }
      return { success: true, message: 'Tickets bought successfully.' };
    } catch (error) {
      this.logger.error(`Error buying syndicate tickets: ${error.message}`);
      throw error;
    }
  }

  @SubscribeMessage('getSyndicateDetails')
  async handleGetSyndicateDetails(
    @MessageBody() syndicateId: number,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Received getSyndicateDetails for syndicate ${syndicateId}`);
    try {
      const syndicate = await this.syndicatesService.getSyndicateDetails(syndicateId);
      if (!syndicate) {
        throw new NotFoundException(`Syndicate #${syndicateId} not found.`);
      }
      client.emit('syndicateDetails', syndicate);
      return syndicate;
    } catch (error) {
      this.logger.error(`Error getting syndicate details: ${error.message}`);
      throw error;
    }
  }

  @SubscribeMessage('joinSyndicateRoom')
  handleJoinSyndicateRoom(client: Socket, syndicateId: string): void {
    client.join(syndicateId);
    this.logger.log(`Client ${client.id} joined syndicate room: ${syndicateId}`);
  }

  @SubscribeMessage('leaveSyndicateRoom')
  handleLeaveSyndicateRoom(client: Socket, syndicateId: string): void {
    client.leave(syndicateId);
    this.logger.log(`Client ${client.id} left syndicate room: ${syndicateId}`);
  }

  @SubscribeMessage('getAllSyndicates')
  async handleGetAllSyndicates(@ConnectedSocket() client: Socket) {
    this.logger.log(`Received getAllSyndicates request from client ${client.id}`);
    try {
      const syndicates = await this.syndicatesService.getAllAvailableSyndicates();
      client.emit('allSyndicatesList', syndicates);
      this.logger.log(`Sent ${syndicates.length} available syndicates to client ${client.id}`);
      return syndicates;
    } catch (error) {
      this.logger.error(`Error getting all syndicates: ${error.message}`);
      throw error;
    }
  }
}
