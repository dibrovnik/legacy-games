import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType } from 'src/entities/notification';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createNotification(
    @Request() req,
    @Body() body: { message: string; type?: NotificationType },
  ) {
    const userId = req.user.id;
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }
    const notification = await this.notificationsService.createNotification(
      userId,
      body.message,
      body.type ?? NotificationType.Default,
    );

    this.notificationsGateway.sendNotificationToUser(userId, notification);

    return notification;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserNotifications(@Request() req) {
    const userId = req.user.id;

    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }
    return this.notificationsService.getUserNotifications(Number(userId));
  }
}
