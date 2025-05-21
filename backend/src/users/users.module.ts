import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { RolesModule } from 'src/roles/roles.module';
import { UsersResolver } from './users.resolver';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { BonusModule } from 'src/bonus/bonus.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), RolesModule, BonusModule],
  providers: [UsersService, UsersResolver],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
