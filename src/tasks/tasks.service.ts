import { Injectable, OnModuleInit } from "@nestjs/common";
import { EventStatus, Prisma } from "@prisma/client";
import { Subject } from "rxjs";
import { DatabaseService } from "src/database/database.service";
import { LoggerService } from "src/logger/logger.service";
import { ResponseDto } from "src/types";
import { TokenPayload } from "src/common/dto/token-payload.dto";
import { ResponseStatus } from "src/common/enum/response-status.enum";
import { UserNotFoundException } from "src/exceptions";

@Injectable()
export class TasksService implements OnModuleInit {
  constructor(private readonly databaseService: DatabaseService) {}

  async onModuleInit() {
    // Remove events that are already expired
    const currentDate = new Date();
    const day = 24 * 60 * 60 * 1000;
    const expirationDate = new Date(currentDate.getTime() - day);

    await this.databaseService.event.deleteMany({
      where: {
        createdAt: {
          lt: expirationDate,
        },
        status: EventStatus.PUBLISHED,
      },
    });
  }

  private readonly logger = new LoggerService(TasksService.name);

  // RxJs
  private readonly webSocketEvents$ = new Subject<{
    name: string;
    data: unknown;
  }>();

  getWebSocketEventsObservable() {
    return this.webSocketEvents$;
  }

  async getTaskById(eventId: string) {
    this.logger.log(`[Get task by id: ${eventId}]`, TasksService.name);

    return await this.databaseService.event.findUnique({
      where: {
        id: +eventId,
      },
      include: {
        user: true,
        favoredBy: true,
      },
    });
  }

  async loadFavoriteTasks(payload: TokenPayload) {
    this.logger.log(`[Load favorite events]`, TasksService.name);

    const user = await this.databaseService.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user || !user.rtHash) {
      throw new UserNotFoundException();
    }

    const events = await this.databaseService.event.findMany({
      where: {
        favoredBy: {
          some: {
            id: user.id,
          },
        },
      },
      include: {
        user: true,
        favoredBy: true,
      },
    });

    return events;
  }

  async addTaskToFavourites(payload: TokenPayload, eventId: string) {
    this.logger.log(`[Add event to favourites: ${eventId}]`, TasksService.name);

    await this.databaseService.event.update({
      where: {
        id: +eventId,
      },
      data: {
        favoredBy: {
          connect: {
            id: payload.sub,
          },
        },
      },
      include: {
        user: true,
        favoredBy: true,
      },
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
        reports: true,
      },
    });
  }

  async removeTaskFromFavourites(payload: TokenPayload, eventId: string) {
    this.logger.log(
      `[Remove event from favourites: ${eventId}]`,
      TasksService.name,
    );

    await this.databaseService.event.update({
      where: {
        id: +eventId,
      },
      data: {
        favoredBy: {
          disconnect: {
            id: payload.sub,
          },
        },
      },
      include: {
        user: true,
      },
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
        reports: true,
      },
    });
  }

  async deleteAllTasks(): Promise<ResponseDto> {
    this.logger.log(`[Delete all events]`, TasksService.name);

    await this.databaseService.event.deleteMany();

    return {
      status: ResponseStatus.SUCCESS,
      message: "All events are removed",
    };
  }

  async createTask(dto: CreateTaskDto, payload: TokenPayload) {
    this.logger.log(
      `[Create an event] - [${dto.event.title}]`,
      TasksService.name,
    );

    const user = await this.databaseService.user.findUnique({
      where: {
        id: payload.sub,
      },
      include: {
        events: true,
        followers: true,
      },
    });

    if (!user || !user.rtHash) {
      throw new UserNotFoundException();
    }

    this.logger.log(
      `[Create an event] - [${user.events.length}]`,
      TasksService.name,
    );

    // if (user.events.length >= 1) {
    //   throw new EventLimitExceedException();
    // }

    dto.event.userId = payload.sub;
    dto.event.status = EventStatus.PUBLISHED;

    const event = await this.databaseService.event.create({
      data: {
        ...dto.event,
        mapPoint: {
          create: {
            ...dto.mapPoint,
          },
        },
      },
      include: {},
    });

    this.logger.log(`[Create event] - [Complete]`, TasksService.name);
    return event;
  }

  async updateTask(
    dto: Prisma.TaskUpdateInput,
    eventId: string,
  ): Promise<ResponseDto> {
    this.logger.log(`[Update event]`, TasksService.name);
    dto.status = EventStatus.PUBLISHED;

    await this.databaseService.event.update({
      where: {
        id: +eventId,
      },
      data: dto,
    });

    return {
      status: ResponseStatus.SUCCESS,
      message: "Event is updated.",
    };
  }

  async getAllTasks(payload: TokenPayload, status: string) {
    this.logger.log(`[Get all events] - [Status ${status}]`, TasksService.name);

    const user = await this.databaseService.user.findUnique({
      where: {
        id: payload.sub,
      },
      include: {
        subscriptions: true,
        followers: true,
      },
    });

    if (!user || !user.rtHash) {
      throw new UserNotFoundException();
    }

    const events = await this.databaseService.event.findMany({
      include: {
        user: true,
        favoredBy: true,
      },
      where: {
        status: status as EventStatus,
        // DO NOT INCLUDE EVENTS THAT ARE PRIVATE FOR SOME USERS
        OR: [
          // CHECK IF
          {
            AND: [
              {
                userId: {
                  in: user.subscriptions.map((subscription) => subscription.id),
                },
              },
            ],
          },
        ],
      },
    });

    return events;
  }

  async getUserTasks(payload: TokenPayload) {
    this.logger.log(`[Get user events]`, TasksService.name);

    const user = await this.databaseService.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user || !user.rtHash) {
      throw new UserNotFoundException();
    }

    return this.databaseService.event.findMany({
      where: {
        userId: payload.sub,
      },
      include: {
        favoredBy: true,
        user: true,
      },
    });
  }

  async deleteTaskById(payload: TokenPayload, eventId: string) {
    this.logger.log(`[Delete event by id] - [${eventId}]`, TasksService.name);

    const event = await this.databaseService.event.findUnique({
      where: {
        id: +eventId,
      },
    });

    if (event.fileUrls.length > 0) {
      this.logger.log(
        `[Delete event by id] - [Delete folder: events/${eventId}`,
        TasksService.name,
      );
    }

    await this.databaseService.event.delete({
      where: {
        id: +eventId,
      },
    });

    return await this.databaseService.event.findMany({
      where: {
        userId: payload.sub,
      },
      include: {
        favoredBy: true,
        user: true,
      },
    });
  }
}
