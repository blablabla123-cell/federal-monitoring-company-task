import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CacheService } from '../cache/cache.service';
import { ResponseStatus, JWTPayload } from '../common';
import { ApiResponse } from '../common/types';
import { DatabaseService } from '../database/database.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly databaseService: DatabaseService,
  ) {}

  private readonly logger = new LoggerService(TasksService.name);

  private cacheKeyByUserId(userId: number): string {
    return `tasks:user:${+userId}`;
  }

  async getTaskById(taskId: string): Promise<ApiResponse> {
    this.logger.log(`[Get task by id]`, TasksService.name);

    const task = await this.databaseService.task.findUnique({
      where: {
        id: +taskId,
      },
    });

    return {
      status: ResponseStatus.SUCCESS,
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

    await this.cacheService.deleteCache(this.cacheKeyByUserId(payload.sub));

    return {
      status: ResponseStatus.SUCCESS,
      message: 'All tasks are removed',
    };
  }

  async createTask(
    dto: Prisma.TaskCreateManyInput,
    payload: JWTPayload,
  ): Promise<ApiResponse> {
    this.logger.log(`[Create a task]`, TasksService.name);

    const task = await this.databaseService.task.create({
      data: dto,
    });

    await this.cacheService.deleteCache(this.cacheKeyByUserId(payload.sub));

    return {
      status: ResponseStatus.SUCCESS,
      message: 'Task is created.',
      data: task,
    };
  }

  async updateTask(
    dto: Prisma.TaskUpdateInput,
    taskId: string,
    payload: JWTPayload,
  ): Promise<ApiResponse> {
    this.logger.log(`[Update task]`, TasksService.name);

    const task = await this.databaseService.task.update({
      where: { id: +taskId },
      data: dto,
    });

    await this.cacheService.deleteCache(this.cacheKeyByUserId(payload.sub));

    return {
      status: ResponseStatus.SUCCESS,
      message: 'Task is updated.',
      data: task,
    };
  }

  async getUserTasks(payload: JWTPayload): Promise<ApiResponse> {
    this.logger.log(`[Get user tasks]`, TasksService.name);

    const key = this.cacheKeyByUserId(payload.sub);

    const tasks = await this.cacheService.validateCache(
      key,
      async () => {
        const tasks = await this.databaseService.task.findMany({
          where: { userId: payload.sub },
          include: {
            user: true,
          },
        });
        return tasks;
      },
      3,
    );

    return {
      status: ResponseStatus.SUCCESS,
      data: tasks,
    };
  }

  async deleteTaskById(
    taskId: string,
    payload: JWTPayload,
  ): Promise<ApiResponse> {
    this.logger.log(`[Delete task by id]`, TasksService.name);

    const task = await this.databaseService.task.delete({
      where: { id: +taskId },
    });

    await this.cacheService.deleteCache(this.cacheKeyByUserId(payload.sub));

    return {
      status: ResponseStatus.SUCCESS,
      message: 'Task is deleted.',
      data: task,
    };
  }
}
