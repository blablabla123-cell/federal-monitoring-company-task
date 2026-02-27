import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';

import { UsersService } from './users.service';

import { AccessTokenGuard } from 'src/authentication/common/guards';
import { GetTokenPayload } from 'src/authentication/common/decorators';
import { ApiResponse } from 'src/common/types';
import { Throttle } from '@nestjs/throttler';
import { JWTPayload } from 'src/common/dto/token-payload.dto';
import { Prisma } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AccessTokenGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  getUser(@GetTokenPayload() payload: JWTPayload): Promise<ApiResponse> {
    return this.usersService.getUser(payload);
  }

  @UseGuards(AccessTokenGuard)
  @Delete('delete-account')
  @HttpCode(HttpStatus.OK)
  deleteAccount(@GetTokenPayload() payload: JWTPayload): Promise<ApiResponse> {
    return this.usersService.deleteAccount(payload);
  }

  @Throttle({
    short: {
      ttl: 60000 * 2,
      limit: 3,
    },
  })
  @UseGuards(AccessTokenGuard)
  @Put('edit-profile')
  @HttpCode(HttpStatus.OK)
  updateUser(
    @GetTokenPayload() payload: JWTPayload,
    @Body() dto: Prisma.UserUpdateInput,
  ): Promise<ApiResponse> {
    return this.usersService.editUser(payload, dto);
  }

  @UseGuards(AccessTokenGuard)
  @Post('log-out')
  @HttpCode(HttpStatus.OK)
  userLogOut(@GetTokenPayload() payload: JWTPayload): Promise<ApiResponse> {
    return this.usersService.userLogOut(payload);
  }
}
