import { Exclude } from "class-transformer";

export class UserDataDto {
  id: string;
  email: string;

  @Exclude()
  password: string;

  name: string;

  createdAt: Date;

  updatedAt: Date;

  @Exclude()
  rtHash: string;
}
