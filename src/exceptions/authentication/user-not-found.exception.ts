import { ForbiddenException } from "@nestjs/common";

export class UserNotFoundException extends ForbiddenException {
  constructor() {
    super("user_not_found");
  }
}
