import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { plainToClass } from 'class-transformer';
import { JWTPayload, ResponseStatus, UserDataDto } from '../common';
import { ApiResponse } from '../common/types';
import { DatabaseService } from '../database/database.service';
import { UserNotFoundException } from '../exceptions';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class UsersService {
  webSocketEvents$: any;
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  private readonly logger = new LoggerService(UsersService.name);

  async getUser(payload: JWTPayload): Promise<ApiResponse> {
    this.logger.log(`[Get User]`, UsersService.name);

    const user = await this.databaseService.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user || !user.rtHash) {
      throw new UserNotFoundException();
    }

    const wsToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_SOCKET'),
        expiresIn: 60 * 15,
      },
    );

    return {
      status: ResponseStatus.SUCCESS,
      data: {
        user: plainToClass(UserDataDto, user),
        socketToken: wsToken,
      },
    };
  }

  async deleteAccount(payload: JWTPayload): Promise<ApiResponse> {
    this.logger.log(`[Delete Account]`, UsersService.name);

    const user = await this.databaseService.user.delete({
      where: {
        id: payload.sub,
      },
    });

    return {
      status: ResponseStatus.SUCCESS,
      message: 'Your account is deleted successfully.',
      data: user,
    };
  }

  async editUser(
    payload: JWTPayload,
    dto: Prisma.UserUpdateInput,
  ): Promise<ApiResponse> {
    this.logger.log(`[Edit User]`, UsersService.name);

    const user = await this.databaseService.user.update({
      where: {
        id: payload.sub,
      },
      data: dto,
    });

    return {
      status: ResponseStatus.SUCCESS,
      message: 'User successfully updated.',
      data: user,
    };
  }

  async userLogOut(payload: JWTPayload): Promise<ApiResponse> {
    this.logger.log(`[User Log out]`, UsersService.name);

    await this.databaseService.user.update({
      where: {
        id: payload.sub,
      },
      data: {
        rtHash: null,
      },
    });

    return {
      status: ResponseStatus.SUCCESS,
      message: `User successfully logged out.`,
    };
  }
}
