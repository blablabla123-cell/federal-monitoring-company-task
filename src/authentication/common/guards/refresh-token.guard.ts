import { AuthGuard } from '@nestjs/passport';
import { InvalidRefreshTokenException } from '../../../exceptions';

export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  handleRequest<TUser = any>(err: any, user: any): TUser {
    if (err || !user) {
      throw new InvalidRefreshTokenException();
    }

    return user;
  }

  constructor() {
    super();
  }
}
