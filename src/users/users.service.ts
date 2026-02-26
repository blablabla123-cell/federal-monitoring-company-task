import { Injectable } from "@nestjs/common";

import { LoggerService } from "src/logger/logger.service";

import { DatabaseService } from "src/database/database.service";
import { plainToClass } from "class-transformer";
import { EditProfileDto } from "./dto/edit-profile.dto";
import { ResponseDto } from "src/types";
import { ConfigService } from "@nestjs/config";
import { TokenPayload } from "src/common/dto/token-payload.dto";
import { UserDataDto } from "src/common/dto/user-data-dto";
import { ResponseStatus } from "src/common/enum/response-status.enum";
import { UserNotFoundException } from "src/exceptions";

@Injectable()
export class UsersService {
  webSocketEvents$: any;
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}
  private readonly logger = new LoggerService(UsersService.name);

  async getUser(payload: TokenPayload) {
    this.logger.log(`[Get User Data] - [${payload.sub}]`, UsersService.name);

    const user = await this.databaseService.user.findUnique({
      where: {
        id: payload.sub,
      },
      include: {
        favourites: true,
        subscriptions: true,
        followedBy: true,
        recipientChats: true,
        senderChats: true,
        events: true,
        reports: true,
      },
    });

    if (!user || !user.rtHash) {
      throw new UserNotFoundException();
    }

    return plainToClass(UserDataDto, user);
  }

  async deleteAccount(payload: TokenPayload): Promise<ResponseDto> {
    this.logger.log(`[Delete Account]`, UsersService.name);

    const user = await this.databaseService.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user || !user.rtHash) {
      throw new UserNotFoundException();
    }

    await this.databaseService.user.delete({
      where: {
        id: payload.sub,
      },
    });

    // Send verification OTP
    // const client = new postmark.ServerClient(
    //   this.configService.get<string>('POSTMARK_API_KEY'),
    // );

    // await client.sendEmailWithTemplate({
    //   TemplateAlias: 'email-verification',
    //   From: 'support@rupor.fun',
    //   To: 'support@rupor.fun',
    //   // To: user.email,
    //   TemplateModel: {
    //     product_url: 'rupor.fun',
    //     product_name: 'Rupor',
    //     name: user.name,
    //     code: otp.slice(0, 3) + '-' + otp.slice(3, 6),
    //     company_name: 'Juicy Code',
    //     company_address:
    //       '357351, Stavropolskiy kray, Essentukskaya, Dubovaya str. 23',
    //   },
    // });

    return {
      status: ResponseStatus.SUCCESS,
      message: "Your account is deleted successfully.",
    };
  }

  async editProfile(payload: TokenPayload, dto: EditProfileDto) {
    this.logger.log(
      `[Edit User Profile] - [${dto.name} ${dto.email}]`,
      UsersService.name,
    );

    const user = await this.databaseService.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user || !user.rtHash) {
      throw new UserNotFoundException();
    }

    await this.databaseService.user.update({
      where: {
        id: payload.sub,
      },
      data: dto,
    });

    return await this.databaseService.user.findUnique({
      where: {
        id: payload.sub,
      },
      include: {
        favourites: true,
        subscriptions: true,
        followedBy: true,
        recipientChats: true,
        senderChats: true,
        events: true,
        reports: true,
      },
    });
  }

  async userLogOut(payload: TokenPayload): Promise<ResponseDto> {
    this.logger.log(`[User Log out]`, UsersService.name);

    await this.databaseService.user.update({
      where: {
        id: payload.sub,
      },
      data: {
        fcmToken: null,
        fcmTokenTimestamp: null,
        rtHash: null,
      },
    });

    return {
      status: ResponseStatus.SUCCESS,
      message: `User successfully logged out.`,
    };
  }
}
