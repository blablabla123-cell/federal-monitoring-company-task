import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthenticationService } from "./authentication.service";
import {
  AuthenticationDto,
  AuthenticationTokensDto as AuthenticationResponseDto,
  AuthenticationTokensDto,
} from "./dto";
import { RefreshTokenGuard } from "./common/guards";
import {
  GetTokenPayload,
  GetUserRefreshToken as GetUserRefreshToken,
} from "./common/decorators";
import { Throttle } from "@nestjs/throttler";
import { TokenPayload } from "src/common/dto/token-payload.dto";

@Controller("authentication")
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post("sign-up")
  @HttpCode(HttpStatus.CREATED)
  signUp(@Body() dto: AuthenticationDto): Promise<AuthenticationResponseDto> {
    return this.authenticationService.signUp(dto);
  }

  @Post("sign-in")
  @HttpCode(HttpStatus.OK)
  signIn(@Body() dto: AuthenticationDto): Promise<AuthenticationResponseDto> {
    return this.authenticationService.signIn(dto);
  }

  @Throttle({
    short: {
      ttl: 60000 * 2,
      limit: 1,
    },
  })
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  changePassword(@Body() dto: AuthenticationDto) {
    return this.authenticationService.resetPassword(dto);
  }

  @UseGuards(RefreshTokenGuard)
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(
    @GetTokenPayload() payload: TokenPayload,
    @GetUserRefreshToken() refreshToken: string,
  ): Promise<AuthenticationTokensDto> {
    return this.authenticationService.refresh(payload, refreshToken);
  }
}
