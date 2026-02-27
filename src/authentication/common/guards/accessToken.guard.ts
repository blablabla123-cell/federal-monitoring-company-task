import { AuthGuard } from '@nestjs/passport';
import { InvalidAccessTokenException } from 'src/exceptions';

export class AccessTokenGuard extends AuthGuard('jwt-access') {
  handleRequest<TUser = any>(err: any, user: any): TUser {
    if (err || !user) {
      throw new InvalidAccessTokenException();
    }

    return user;
  }

  constructor() {
    super();
  }
}
