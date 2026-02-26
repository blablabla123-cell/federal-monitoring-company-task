import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class AuthenticationDto {
  @IsNotEmpty({
    message: "empty_email",
  })
  @IsString({
    message: "email_not_string",
  })
  @IsEmail(
    {},
    {
      message: "invalid_email",
    },
  )
  email: string;

  @IsNotEmpty({
    message: "empty_password",
  })
  @IsString({
    message: "password_not_string",
  })
  @IsString({
    message: "invalid_password",
  })
  @MinLength(8, {
    message: "password_too_short",
  })
  @MaxLength(24, {
    message: "password_too_long",
  })
  password: string;

  name: string | undefined;

  rtHash: string | undefined;
}
