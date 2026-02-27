import { ForbiddenException } from '@nestjs/common';

export class InvalidRefreshToken extends ForbiddenException {
  constructor() {
    super('invalid_refresh_token');
  }
}
