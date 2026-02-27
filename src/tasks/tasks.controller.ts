import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Delete,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { AccessTokenGuard, GetTokenPayload } from 'src/authentication/common';
import { TasksService } from './tasks.service';
import { JWTPayload } from 'src/common';
import { Prisma } from '@prisma/client';
import { ApiResponse } from 'src/common/types';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(AccessTokenGuard)
  @Get('/my')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(1000 * 60 * 1) // 1 minute
  @HttpCode(HttpStatus.OK)
  getUserTasks(@GetTokenPayload() payload: JWTPayload): Promise<ApiResponse> {
    return this.tasksService.getUserTasks(payload);
  }

  @UseGuards(AccessTokenGuard)
  @UseInterceptors(CacheInterceptor)
  @Get('/favorite')
  @CacheTTL(1000 * 60 * 1) // 1 minute
  @HttpCode(HttpStatus.OK)
  loadFavoriteTasks(
    @GetTokenPayload() payload: JWTPayload,
  ): Promise<ApiResponse> {
    return this.tasksService.loadFavoriteTasks(payload);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  getTaskById(@Param('id') taskId: string): Promise<ApiResponse> {
    return this.tasksService.getTaskById(taskId);
  }

  // ?? Idempotent
  @UseGuards(AccessTokenGuard)
  @Post('/add-to-favourites/:id')
  @HttpCode(HttpStatus.OK)
  addTaskToFavourites(
    @GetTokenPayload() payload: JWTPayload,
    @Param('id') taskId: string,
  ): Promise<ApiResponse> {
    return this.tasksService.addTaskToFavourites(payload, taskId);
  }

  @UseGuards(AccessTokenGuard)
  @Delete('/remove-from-favourites/:id')
  @HttpCode(HttpStatus.OK)
  removeTaskFromFavourites(
    @GetTokenPayload() payload: JWTPayload,
    @Param('id') taskId: string,
  ): Promise<ApiResponse> {
    return this.tasksService.removeTaskFromFavourites(payload, taskId);
  }

  @UseGuards(AccessTokenGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTask(@Body() task: Prisma.TaskCreateInput): Promise<ApiResponse> {
    return this.tasksService.createTask(task);
  }

  @UseGuards(AccessTokenGuard)
  @Put('update/:id')
  @HttpCode(HttpStatus.CREATED)
  updateTask(
    @Param('id') taskId: string,
    @Body() task: Prisma.TaskUpdateInput,
  ): Promise<ApiResponse> {
    return this.tasksService.updateTask(task, taskId);
  }

  @UseGuards(AccessTokenGuard)
  @Delete('delete-all')
  @HttpCode(HttpStatus.OK)
  deleteAllTasks(@GetTokenPayload() payload: JWTPayload): Promise<ApiResponse> {
    return this.tasksService.deleteAllTasks(payload);
  }

  @UseGuards(AccessTokenGuard)
  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  deleteTaskById(@Param('id') taskId: string): Promise<ApiResponse> {
    return this.tasksService.deleteTaskById(taskId);
  }
}
