import { BonusModule } from './bonus/bonus.module';
import { VipSettingsController } from './vip/vip-settings.controller';
import { VipModule } from './vip/vip.module';
import { BattleroyalModule } from './battleroyal/battleroyal.module';
import { SyndicatesModule } from './syndicate/syndicates.module';
import { DrawsModule } from './draws/draws.module';
import { TicketsModule } from './tickets/tickets.module';
import { LotteriesModule } from './lotteries/lotteries.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Not } from 'typeorm';
import { NotificationsModule } from './notifications/notifications.module';
import { FriendsModule } from './friends/friends.module';
import { LotteryTypesModule } from './lottery-types/lottery-type.module';
import { MinesweeperModule } from './games/minesweeper/minesweeper.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    BonusModule,
    VipModule,
    BattleroyalModule,
    SyndicatesModule,
    DrawsModule,
    TicketsModule,
    LotteriesModule,
    LotteryTypesModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      context: ({ req }) => ({ req }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT') || 5432,
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        synchronize: true,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: true,
      }),
    }),
    UsersModule,
    AuthModule,
    PermissionsModule,
    RolesModule,
    NotificationsModule,
    FriendsModule,
    MinesweeperModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
