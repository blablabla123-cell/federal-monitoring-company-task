import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { JWTPayload, ResponseStatus } from '../common';
import { ApiResponse } from '../common/types';
import { Prisma } from '@prisma/client';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
  let controller: TasksController;
  let mockService: any;

  const userPayload: JWTPayload = { sub: 1 };
  const taskId = '1';

  beforeEach(async () => {
    mockService = {
      getUserTasks: jest.fn(),
      getTaskById: jest.fn(),
      createTask: jest.fn(),
      updateTask: jest.fn(),
      deleteAllTasks: jest.fn(),
      deleteTaskById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Return list of user tasks', () => {
    it('Should return user tasks', async () => {
      const mockResponse: ApiResponse = {
        status: ResponseStatus.SUCCESS,
        message: 'Tasks retrieved successfully',
        data: [
          { id: '1', title: 'Task 1', userId: 1 },
          { id: '2', title: 'Task 2', userId: 1 },
        ],
      };

      mockService.getUserTasks.mockResolvedValue(mockResponse);

      const result = await controller.getUserTasks(userPayload);

      expect(mockService.getUserTasks).toHaveBeenCalledWith(userPayload);
      expect(mockService.getUserTasks).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Single task get endpoint', () => {
    it('Should return task by id', async () => {
      const mockResponse: ApiResponse = {
        status: ResponseStatus.SUCCESS,
        data: { id: taskId, title: 'Test task', userId: 1 },
      };

      mockService.getTaskById.mockResolvedValue(mockResponse);

      const result = await controller.getTaskById(taskId);

      expect(mockService.getTaskById).toHaveBeenCalledWith(taskId);
      expect(mockService.getTaskById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Create task endpoint', () => {
    it('Should create new task', async () => {
      const taskData: Prisma.TaskCreateManyInput = {
        title: 'Kill Bill',
        userId: userPayload.sub,
      };

      const mockResponse: ApiResponse = {
        status: ResponseStatus.SUCCESS,
        message: 'Task created successfully',
        data: { id: '3', title: taskData.title, userId: taskData.userId },
      };

      mockService.createTask.mockResolvedValue(mockResponse);

      const result = await controller.createTask(taskData, userPayload);

      expect(mockService.createTask).toHaveBeenCalledWith(
        taskData,
        userPayload,
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Update task route', () => {
    it('Should update existing task', async () => {
      const updateData: Prisma.TaskUpdateInput = {
        title: 'Kill Bill 2',
      };

      const mockResponse: ApiResponse = {
        status: ResponseStatus.SUCCESS,
        message: 'Task updated successfully',
        data: { id: taskId, title: updateData.title, userId: 1 },
      };

      mockService.updateTask.mockResolvedValue(mockResponse);

      const result = await controller.updateTask(
        taskId,
        updateData,
        userPayload,
      );

      expect(mockService.updateTask).toHaveBeenCalledWith(
        updateData,
        taskId,
        userPayload,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Delete all user tasks', () => {
    it('Should delete all user tasks', async () => {
      const mockResponse: ApiResponse = {
        status: ResponseStatus.SUCCESS,
        message: 'All tasks deleted successfully',
      };

      mockService.deleteAllTasks.mockResolvedValue(mockResponse);

      const result = await controller.deleteAllTasks(userPayload);

      expect(mockService.deleteAllTasks).toHaveBeenCalledWith(userPayload);
      expect(mockService.deleteAllTasks).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Delete specific task route', () => {
    it('Should delete task by id', async () => {
      const mockResponse: ApiResponse = {
        status: ResponseStatus.SUCCESS,
        message: 'Task deleted successfully',
        data: { id: taskId, title: 'Deleted task' },
      };

      mockService.deleteTaskById.mockResolvedValue(mockResponse);

      const result = await controller.deleteTaskById(userPayload, taskId);

      expect(mockService.deleteTaskById).toHaveBeenCalledWith(
        taskId,
        userPayload,
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
