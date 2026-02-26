import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { DatabaseService } from "src/database/database.service";
import { JwtService } from "@nestjs/jwt";
import { AuthenticationUtils } from "src/authentication/authentication.utils";

import { AuthenticationDto } from "./dto";
import { ConfigService } from "@nestjs/config";
import { AuthenticationTokensDto } from "./dto/authentication/authentication-tokens.dto";
import { TokenPayload } from "src/common/dto/token-payload.dto";
import { LoggerService } from "src/logger/logger.service";
import { UserNotFoundException } from "src/exceptions/authentication/user-not-found.exception";
import { InvalidCredentialsException } from "src/exceptions/invalid-credentials.exception";
import { UserAlreadyExistsException } from "src/exceptions";
import { InvalidRefreshToken } from "src/exceptions/authentication/invalid-refresh-token.exception";

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  private readonly logger = new LoggerService(AuthenticationService.name);

  async signUp(dto: AuthenticationDto): Promise<AuthenticationTokensDto> {
    this.logger.log(`[Sign up] - [${dto.email}]`, AuthenticationService.name);

    let user = await this.databaseService.user.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      throw new UserAlreadyExistsException();
    }

    dto.password = await AuthenticationUtils.hash(dto.password);

    // dto.name = AuthenticationUtils.generateName();

    user = await this.databaseService.user.create({
      data: dto,
    });

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
        expiresIn: 60 * 15, // 15 minutes
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: 60 * 60 * 24 * 7, // 1 week
      },
    );

    const rtHash = await AuthenticationUtils.hash(refreshToken);

    dto.rtHash = rtHash;

    await this.databaseService.user.update({
      where: { id: user.id },
      data: { rtHash: rtHash },
    });

    return { accessToken, refreshToken };
  }

  async signIn(dto: AuthenticationDto): Promise<AuthenticationTokensDto> {
    this.logger.log(`[Sign In] [${dto.email}]`, AuthenticationService.name);
    const user = await this.databaseService.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    const isPasswordMatch = await AuthenticationUtils.compare(
      dto.password,
      user.password,
    );

    if (!isPasswordMatch) {
      throw new InvalidCredentialsException();
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
        expiresIn: 60 * 15, // 15 minutes
        // expiresIn: 5,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: 60 * 60 * 24 * 7, // 1 week
      },
    );

    const rtHash = await AuthenticationUtils.hash(refreshToken);

    await this.databaseService.user.update({
      where: { id: user.id },
      data: { rtHash },
    });

    return { accessToken, refreshToken };
  }

  async refresh(
    payload: TokenPayload,
    refreshToken: string,
  ): Promise<AuthenticationTokensDto> {
    const user = await this.databaseService.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user || !user.rtHash) {
      throw new UserNotFoundException();
    }

    this.logger.log(
      `[Refresh] - [Compare] - [${refreshToken}]`,
      AuthenticationService.name,
    );

    const rtMatches = await bcrypt.compare(refreshToken, user.rtHash);
    if (!rtMatches) {
      throw new InvalidRefreshToken();
    }

    this.logger.log(
      `[Refresh] - [Sign new access token]`,
      AuthenticationService.name,
    );

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
        expiresIn: 60 * 15, // 15 minutes
        // expiresIn: 5,
      },
    );

    return { accessToken, refreshToken };
  }

  async resetPassword(dto: AuthenticationDto) {
    this.logger.log(
      `[Change password] [For: ${dto.email}]`,
      AuthenticationService.name,
    );

    const user = await this.databaseService.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    const passwordHash = await AuthenticationUtils.hash(dto.password);

    return await this.databaseService.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: passwordHash,
      },
      include: {
        favourites: true,
        subscriptions: true,
        followedBy: true,
        recipientChats: true,
        senderChats: true,
      },
    });
  }
}
