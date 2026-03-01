import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { AccessTokenStrategy, RefreshTokenStrategy } from './strategies';
import { DatabaseModule } from '../database/database.module';
import { AuthenticationUtils } from './authentication.utils';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    AuthenticationUtils,
  ],
})
export class AuthenticationModule {}
