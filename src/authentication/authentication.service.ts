import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ResponseStatus, JWTPayload } from '../common';
import { ApiResponse } from '../common/types';
import { DatabaseService } from '../database/database.service';
import {
  UserAlreadyExistsException,
  UserNotFoundException,
  InvalidCredentialsException,
  InvalidRefreshTokenException,
} from '../exceptions';
import { LoggerService } from '../logger/logger.service';
import { AuthenticationUtils } from './authentication.utils';
import { AuthenticationDto } from './dto';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly utils: AuthenticationUtils,
  ) {}
  private readonly logger = new LoggerService(AuthenticationService.name);

  async signUp(dto: AuthenticationDto): Promise<ApiResponse> {
    this.logger.log(`[Sign up]`, AuthenticationService.name);

    let user = await this.databaseService.user.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      throw new UserAlreadyExistsException();
    }

    dto.password = await this.utils.hash(dto.password);

    dto.name = this.utils.generateName();

    user = await this.databaseService.user.create({
      data: dto,
    });

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: 60 * 15,
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: 60 * 60 * 24 * 7,
      },
    );

    const rtHash = await this.utils.hash(refreshToken);

    dto.rtHash = rtHash;

    await this.databaseService.user.update({
      where: { id: user.id },
      data: { rtHash: rtHash },
    });

    return {
      status: ResponseStatus.SUCCESS,
      message: 'User successfully signed up.',
      data: { accessToken, refreshToken },
    };
  }

  async signIn(dto: AuthenticationDto): Promise<ApiResponse> {
    this.logger.log(`[Sign In]`, AuthenticationService.name);

    const user = await this.databaseService.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    const isPasswordMatch = await this.utils.compare(
      dto.password,
      user.password,
    );

    if (!isPasswordMatch) {
      throw new InvalidCredentialsException();
    }
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: 60 * 15,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: 60 * 60 * 24 * 7,
      },
    );

    const rtHash = await this.utils.hash(refreshToken);

    await this.databaseService.user.update({
      where: { id: user.id },
      data: { rtHash },
    });

    return {
      status: ResponseStatus.SUCCESS,
      message: 'User successfully signed in.',
      data: { accessToken, refreshToken },
    };
  }

  async refresh(
    payload: JWTPayload,
    refreshToken: string,
  ): Promise<ApiResponse> {
    const user = await this.databaseService.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user || !user.rtHash) {
      throw new UserNotFoundException();
    }

    this.logger.log(`[Refresh]`, AuthenticationService.name);

    const rtMatches = await this.utils.compare(refreshToken, user.rtHash);
    if (!rtMatches) {
      throw new InvalidRefreshTokenException();
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: 60 * 15,
      },
    );

    return {
      status: ResponseStatus.SUCCESS,
      data: { accessToken },
    };
  }

  async resetPassword(dto: AuthenticationDto) {
    this.logger.log(`[Reset password] `, AuthenticationService.name);

    const user = await this.databaseService.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    const passwordHash = await this.utils.hash(dto.password);

    await this.databaseService.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: passwordHash,
      },
    });

    return {
      status: ResponseStatus.SUCCESS,
      message: 'Password has been reset.',
    };
  }
}
