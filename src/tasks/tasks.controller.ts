import {
  Controller,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Body,
  Put,
  Delete,
  Inject,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AccessTokenGuard, GetTokenPayload } from '../authentication/common';
import { JWTPayload } from '../common';
import { ApiResponse } from '../common/types';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(AccessTokenGuard)
  @Get('/my')
  @HttpCode(HttpStatus.OK)
  getUserTasks(@GetTokenPayload() payload: JWTPayload): Promise<ApiResponse> {
    return this.tasksService.getUserTasks(payload);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  getTaskById(@Param('id') taskId: string): Promise<ApiResponse> {
    return this.tasksService.getTaskById(taskId);
  }

  @UseGuards(AccessTokenGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTask(
    @Body() task: Prisma.TaskCreateManyInput,
    @GetTokenPayload() payload: JWTPayload,
  ): Promise<ApiResponse> {
    return this.tasksService.createTask(task, payload);
  }

  @UseGuards(AccessTokenGuard)
  @Put('update/:id')
  @HttpCode(HttpStatus.OK)
  updateTask(
    @Param('id') taskId: string,
    @Body() task: Prisma.TaskUpdateInput,
    @GetTokenPayload() payload: JWTPayload,
  ): Promise<ApiResponse> {
    return this.tasksService.updateTask(task, taskId, payload);
  }

  @UseGuards(AccessTokenGuard)
  @Delete('delete-all')
  @HttpCode(HttpStatus.OK)
  deleteAllTasks(@GetTokenPayload() payload: JWTPayload): Promise<ApiResponse> {
    return this.tasksService.deleteAllTasks(payload);
  }

  @UseGuards(AccessTokenGuard)
  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  deleteTaskById(
    @GetTokenPayload() payload: JWTPayload,
    @Param('id') taskId: string,
  ): Promise<ApiResponse> {
    return this.tasksService.deleteTaskById(taskId, payload);
  }
}
