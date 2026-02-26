import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";

import { UsersService } from "./users.service";

import { AccessTokenGuard } from "src/authentication/common/guards";
import { GetTokenPayload } from "src/authentication/common/decorators";
import { EditProfileDto } from "./dto";
import { ResponseDto } from "src/types";
import { Throttle } from "@nestjs/throttler";
import { TokenPayload } from "src/common/dto/token-payload.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AccessTokenGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  getUser(@GetTokenPayload() payload: TokenPayload) {
    return this.usersService.getUser(payload);
  }

  @UseGuards(AccessTokenGuard)
  @Delete("delete-account")
  @HttpCode(HttpStatus.OK)
  deleteAccount(
    @GetTokenPayload() payload: TokenPayload,
  ): Promise<ResponseDto> {
    return this.usersService.deleteAccount(payload);
  }

  @Throttle({
    short: {
      ttl: 60000 * 2,
      limit: 3,
    },
  })
  @UseGuards(AccessTokenGuard)
  @Post("edit-profile")
  @HttpCode(HttpStatus.OK)
  editProfile(
    @GetTokenPayload() payload: TokenPayload,
    @Body() dto: EditProfileDto,
  ) {
    return this.usersService.editProfile(payload, dto);
  }

  @UseGuards(AccessTokenGuard)
  @Delete("log-out")
  @HttpCode(HttpStatus.OK)
  userLogOut(@GetTokenPayload() payload: TokenPayload): Promise<ResponseDto> {
    return this.usersService.userLogOut(payload);
  }
}
