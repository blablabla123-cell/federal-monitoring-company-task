import { ForbiddenException } from '@nestjs/common';

export class InvalidRefreshTokenException extends ForbiddenException {
  constructor() {
    super('invalid_refresh_token');
  }
}
