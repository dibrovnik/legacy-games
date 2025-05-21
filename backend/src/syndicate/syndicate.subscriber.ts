import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import {
  Connection,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { Syndicate } from '../entities/syndicate.entity';
import { SyndicateMember } from '../entities/syndicate-member.entity';
import { SyndicateTicket } from '../entities/syndicate-ticket.entity';
import { SyndicatesGateway } from './syndicates.gateway';
import { SyndicatesService } from './syndicates.service';

@Injectable()
export class SyndicateSubscriber
  implements EntitySubscriberInterface<Syndicate | SyndicateMember | SyndicateTicket>
{
  constructor(
    @InjectConnection() readonly connection: Connection,
    private readonly syndicatesGateway: SyndicatesGateway,
    private readonly syndicatesService: SyndicatesService,
  ) {
    // Убрали connection.subscribers.push(this); - TypeORM сам зарегистрирует благодаря @Injectable()
    // и убрали listenTo, чтобы подписчик слушал все сущности,
    // а проверку типа делаем внутри afterInsert, afterUpdate, afterRemove.
  }

  // listenTo() {
  //     return [Syndicate, SyndicateMember, SyndicateTicket];
  // }

  async afterInsert(event: InsertEvent<any>) {
    // Используем `any` здесь для гибкости, далее делаем проверку `instanceof`
    if (event.entity instanceof Syndicate) {
      const fullSyndicate = await this.syndicatesService.getSyndicateDetails(event.entity.id);
      if (fullSyndicate) {
        this.syndicatesGateway.server
          .to(fullSyndicate.id.toString())
          .emit('syndicateUpdated', fullSyndicate);
        this.syndicatesGateway.server.emit('allSyndicatesListUpdated');
      }
    } else if (event.entity instanceof SyndicateMember) {
      const fullSyndicate = await this.syndicatesService.getSyndicateDetails(
        event.entity.syndicate.id,
      );
      if (fullSyndicate) {
        this.syndicatesGateway.server
          .to(fullSyndicate.id.toString())
          .emit('syndicateUpdated', fullSyndicate);
        this.syndicatesGateway.server.emit('allSyndicatesListUpdated');
      }
    } else if (event.entity instanceof SyndicateTicket) {
      const fullSyndicate = await this.syndicatesService.getSyndicateDetails(
        event.entity.syndicate.id,
      );
      if (fullSyndicate) {
        this.syndicatesGateway.server
          .to(fullSyndicate.id.toString())
          .emit('syndicateUpdated', fullSyndicate);
      }
    }
  }

  async afterUpdate(event: UpdateEvent<any>) {
    // Используем `any` здесь для гибкости
    if (!event.entity || !event.entity.id) return;

    if (event.entity instanceof Syndicate) {
      const fullSyndicate = await this.syndicatesService.getSyndicateDetails(event.entity.id);
      if (fullSyndicate) {
        this.syndicatesGateway.server
          .to(fullSyndicate.id.toString())
          .emit('syndicateUpdated', fullSyndicate);
        if (event.updatedColumns.some((col) => col.propertyName === 'status')) {
          this.syndicatesGateway.server.emit('allSyndicatesListUpdated');
        }
      }
    } else if (event.entity instanceof SyndicateMember) {
      const fullSyndicate = await this.syndicatesService.getSyndicateDetails(
        event.entity.syndicate.id,
      );
      if (fullSyndicate) {
        this.syndicatesGateway.server
          .to(fullSyndicate.id.toString())
          .emit('syndicateUpdated', fullSyndicate);
      }
    } else if (event.entity instanceof SyndicateTicket) {
      const fullSyndicate = await this.syndicatesService.getSyndicateDetails(
        event.entity.syndicate.id,
      );
      if (fullSyndicate) {
        this.syndicatesGateway.server
          .to(fullSyndicate.id.toString())
          .emit('syndicateUpdated', fullSyndicate);
      }
    }
  }

  async afterRemove(event: RemoveEvent<any>) {
    // Используем `any` здесь для гибкости
    if (event.entity instanceof Syndicate) {
      this.syndicatesGateway.server.emit('syndicateRemoved', event.entityId);
      this.syndicatesGateway.server.emit('allSyndicatesListUpdated');
    } else if (event.databaseEntity instanceof SyndicateMember) {
      const syndicateId = event.databaseEntity.syndicate.id;
      const fullSyndicate = await this.syndicatesService.getSyndicateDetails(syndicateId);
      if (fullSyndicate) {
        this.syndicatesGateway.server
          .to(fullSyndicate.id.toString())
          .emit('syndicateUpdated', fullSyndicate);
      } else {
        this.syndicatesGateway.server.emit('syndicateUpdated', { id: syndicateId, removed: true });
      }
      this.syndicatesGateway.server.emit('allSyndicatesListUpdated');
    } else if (event.databaseEntity instanceof SyndicateTicket) {
      const syndicateId = event.databaseEntity.syndicate.id;
      const fullSyndicate = await this.syndicatesService.getSyndicateDetails(syndicateId);
      if (fullSyndicate) {
        this.syndicatesGateway.server
          .to(fullSyndicate.id.toString())
          .emit('syndicateUpdated', fullSyndicate);
      }
    }
  }
}
