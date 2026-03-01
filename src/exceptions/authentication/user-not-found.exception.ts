import { ForbiddenException, NotFoundException } from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super('user_not_found');
  }
}
