import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from './logger/logger.module';
import { TasksModule } from './tasks/tasks.module';
import { SocketModule } from './socket/socket.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database/database.service';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService as CacheConfigService } from './cache/cache-config.service';

@Module({
  imports: [
    UsersModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useClass: CacheConfigService,
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
    SocketModule,
    AuthenticationModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],

  providers: [
    DatabaseService,
    CacheConfigService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
