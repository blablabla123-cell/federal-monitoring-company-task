import { Injectable } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import { DatabaseService } from 'src/database/database.service';
import { plainToClass } from 'class-transformer';
import { ApiResponse } from 'src/common/types';
import { ConfigService } from '@nestjs/config';
import { JWTPayload } from 'src/common/dto/token-payload.dto';
import { UserDataDto } from 'src/common/dto/user-data-dto';
import { ResponseStatus } from 'src/common/enum/response-status.enum';
import { UserNotFoundException } from 'src/exceptions';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  webSocketEvents$: any;
  constructor(private readonly databaseService: DatabaseService) {}
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

    return {
      status: ResponseStatus.SUCCESS,
      data: plainToClass(UserDataDto, user),
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
