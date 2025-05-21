import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType } from 'src/entities/notification';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => [Notification], { name: 'userNotifications' })
  async getUserNotifications(@Context('req') req: any): Promise<Notification[]> {
    const userId = req.user.id;
    return this.notificationsService.getUserNotifications(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Notification)
  async createNotification(
    @Context('req') req: any,
    @Args('message', { type: () => String }) message: string,
    @Args('type', { type: () => NotificationType, nullable: true }) type?: NotificationType,
  ): Promise<Notification> {
    const userId = req.user.id;
    return this.notificationsService.createNotification(userId, message, type);
  }
}
