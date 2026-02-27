import { UnauthorizedException } from '@nestjs/common';

export class InvalidAccessTokenException extends UnauthorizedException {
  constructor() {
    super('invalid_access_token');
  }
}
