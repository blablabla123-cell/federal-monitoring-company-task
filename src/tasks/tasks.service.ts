import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Subject } from 'rxjs';
import { JWTPayload, ResponseStatus } from 'src/common';
import { DatabaseService } from 'src/database/database.service';
import { LoggerService } from 'src/logger/logger.service';
import { ApiResponse } from 'src/common/types';

@Injectable()
export class TasksService {
  constructor(private readonly databaseService: DatabaseService) {}

  private readonly logger = new LoggerService(TasksService.name);

  // RxJs
  private readonly webSocketEvents$ = new Subject<{
    name: string;
    data: unknown;
  }>();

  getWebSocketEventsObservable() {
    return this.webSocketEvents$;
  }

  async getTaskById(taskId: string): Promise<ApiResponse> {
    this.logger.log(`[Get task by id]`, TasksService.name);

    const task = await this.databaseService.task.findUnique({
      where: {
        id: +taskId,
      },
      include: {
        favoredBy: true,
      },
    });

    return {
      status: ResponseStatus.SUCCESS,
      data: task,
    };
  }

  async loadFavoriteTasks(payload: JWTPayload): Promise<ApiResponse> {
    this.logger.log(`[Load favorite tasks]`, TasksService.name);

    const tasks = await this.databaseService.task.findMany({
      where: {
        favoredBy: {
          some: {
            id: payload.sub,
          },
        },
      },
      include: {
        user: true,
        favoredBy: true,
      },
    });

    return {
      status: ResponseStatus.SUCCESS,
      data: tasks,
    };
  }

  async addTaskToFavourites(
    payload: JWTPayload,
    taskId: string,
  ): Promise<ApiResponse> {
    this.logger.log(`[Add task to favourites]`, TasksService.name);

    const task = await this.databaseService.task.update({
      where: {
        id: +taskId,
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

    return {
      status: ResponseStatus.SUCCESS,
      message: 'Task is added to favourites.',
      data: task,
    };
  }

  async removeTaskFromFavourites(
    payload: JWTPayload,
    taskId: string,
  ): Promise<ApiResponse> {
    this.logger.log(`[Remove task from favourites]`, TasksService.name);

    const task = await this.databaseService.task.update({
      where: {
        id: +taskId,
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

    return {
      status: ResponseStatus.SUCCESS,
      message: 'Task is removed from favourites.',
      data: task,
    };
  }

  async deleteAllTasks(payload: JWTPayload): Promise<ApiResponse> {
    this.logger.log(`[Delete all tasks]`, TasksService.name);

    await this.databaseService.task.deleteMany({
      where: {
        userId: payload.sub,
      },
    });

    return {
      status: ResponseStatus.SUCCESS,
      message: 'All tasks are removed',
    };
  }

  async createTask(dto: Prisma.TaskCreateInput): Promise<ApiResponse> {
    this.logger.log(`[Create a task]`, TasksService.name);

    const task = await this.databaseService.task.create({
      data: dto,
    });

    return {
      status: ResponseStatus.SUCCESS,
      message: 'Task is created.',
      data: task,
    };
  }

  async updateTask(
    dto: Prisma.TaskUpdateInput,
    taskId: string,
  ): Promise<ApiResponse> {
    this.logger.log(`[Update task]`, TasksService.name);

    const task = await this.databaseService.task.update({
      where: {
        id: +taskId,
      },
      data: dto,
    });

    return {
      status: ResponseStatus.SUCCESS,
      message: 'Task is updated.',
      data: task,
    };
  }

  async getUserTasks(payload: JWTPayload): Promise<ApiResponse> {
    this.logger.log(`[Get user tasks]`, TasksService.name);

    const tasks = await this.databaseService.task.findMany({
      where: {
        userId: payload.sub,
      },
      include: {
        favoredBy: true,
        user: true,
      },
    });

    return {
      status: ResponseStatus.SUCCESS,
      data: tasks,
    };
  }

  async deleteTaskById(taskId: string): Promise<ApiResponse> {
    this.logger.log(`[Delete task by id]`, TasksService.name);

    const task = await this.databaseService.task.delete({
      where: {
        id: +taskId,
      },
    });

    return {
      status: ResponseStatus.SUCCESS,
      message: 'Task is deleted.',
      data: task,
    };
  }
}
