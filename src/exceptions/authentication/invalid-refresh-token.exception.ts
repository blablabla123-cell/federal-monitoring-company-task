import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

export class InvalidRefreshTokenException extends UnauthorizedException {
  constructor() {
    super('invalid_refresh_token');
  }
}
