import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { Throttle } from '@nestjs/throttler';
import {
  GetTokenPayload,
  GetUserRefreshToken,
  RefreshTokenGuard,
} from './common';
import { JWTPayload } from 'src/common/dto';
import { ApiResponse } from 'src/common/types';
import { AuthenticationDto } from './dto';

@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  signUp(@Body() dto: AuthenticationDto): Promise<ApiResponse> {
    return this.authenticationService.signUp(dto);
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() dto: AuthenticationDto): Promise<ApiResponse> {
    return this.authenticationService.signIn(dto);
  }

  @Throttle({
    short: {
      ttl: 60 * 1000 * 2,
      limit: 1,
    },
  })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  changePassword(@Body() dto: AuthenticationDto): Promise<ApiResponse> {
    return this.authenticationService.resetPassword(dto);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @GetTokenPayload() payload: JWTPayload,
    @GetUserRefreshToken() refreshToken: string,
  ): Promise<ApiResponse> {
    return this.authenticationService.refresh(payload, refreshToken);
  }
}
