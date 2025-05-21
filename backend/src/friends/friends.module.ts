// src/friends/friends.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { UsersModule } from '../users/users.module';
import { Friend } from 'src/entities/friend.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Friend]), // регистрируем Friend
    UsersModule, // чтобы был доступ к UsersService
  ],
  providers: [FriendsService],
  controllers: [FriendsController],
})
export class FriendsModule {}
