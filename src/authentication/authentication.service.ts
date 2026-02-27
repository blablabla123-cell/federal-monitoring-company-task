import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/database/database.service';
import { LoggerService } from 'src/logger/logger.service';
import { AuthenticationDto } from './dto';
import {
  InvalidCredentialsException,
  InvalidRefreshToken,
  UserAlreadyExistsException,
  UserNotFoundException,
} from 'src/exceptions';
import { AuthenticationUtils } from './authentication.utils';
import { JWTPayload } from 'src/common/dto';
import { compare } from 'bcryptjs';
import { ApiResponse } from 'src/common/types';
import { ResponseStatus } from 'src/common';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

    dto.password = await AuthenticationUtils.hash(dto.password);

    dto.name = AuthenticationUtils.generateName();

    user = await this.databaseService.user.create({
      data: dto,
    });

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: 60 * 15, // 15 minutes
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: 60 * 60 * 24 * 7, // 1 week
      },
    );

    const rtHash = await AuthenticationUtils.hash(refreshToken);

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
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: 60 * 15, // 15 minutes
        // expiresIn: 5,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: 60 * 60 * 24 * 7, // 1 week
      },
    );

    const rtHash = await AuthenticationUtils.hash(refreshToken);

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

    const rtMatches = await compare(refreshToken, user.rtHash);
    if (!rtMatches) {
      throw new InvalidRefreshToken();
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: 60 * 15, // 15 minutes
        // expiresIn: 5,
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

    const passwordHash = await AuthenticationUtils.hash(dto.password);

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
