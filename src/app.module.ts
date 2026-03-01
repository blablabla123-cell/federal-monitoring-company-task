import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from './logger/logger.module';
import { TasksModule } from './tasks/tasks.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database/database.service';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfigService } from './cache/cache-config.service';
import { BullModule } from '@nestjs/bull';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    UsersModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useClass: CacheConfigService,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
      },
    }),
    DatabaseModule,
    TasksModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    LoggerModule,
    AuthenticationModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ReportsModule,
  ],

  providers: [
    DatabaseService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
