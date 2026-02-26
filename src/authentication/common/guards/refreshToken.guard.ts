import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvalidRefreshToken } from 'src/exceptions';

export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    if (err || !user) {
      throw new InvalidRefreshToken();
    }

    return user;
  }

  constructor() {
    super();
  }
}
