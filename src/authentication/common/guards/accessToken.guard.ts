import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { InvalidAccessTokenException, UserNotFoundException } from 'src/exceptions';
import { LoggerService } from 'src/logger/logger.service';

export class AccessTokenGuard extends AuthGuard('jwt-access') {
  private readonly logger = new LoggerService(AccessTokenGuard.name);

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    if (err || !user) {
      throw new InvalidAccessTokenException();
    }

    return user;
  }

  
  constructor() {
    super();
  }
}
