import { ForbiddenException } from '@nestjs/common';

export class InvalidCredentialsException extends ForbiddenException {
  constructor() {
    super('invalid_credentials');
  }
}
