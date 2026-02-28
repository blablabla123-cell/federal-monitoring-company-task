import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { CacheService } from '../cache/cache.service';
import { DatabaseService } from '../database/database.service';
import { Prisma } from '@prisma/client';
import { ResponseStatus } from '../common';
import { JWTPayload } from '../common';

describe('TasksService', () => {
  let service: TasksService;
  let mockCacheService: any;
  let mockDatabaseService: any;

  const mockPayload: JWTPayload = { sub: 1 };

  const mockTask = {
    id: 1,
    title: 'Task 1',
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTasks = [mockTask];

  beforeEach(async () => {
    mockCacheService = {
      deleteCache: jest.fn(),
      validateCache: jest
        .fn()
        .mockImplementation(
          async (_key: string, fetchFn: () => Promise<any>) => {
            return await fetchFn();
          },
        ),
    };

    mockDatabaseService = {
      task: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: CacheService, useValue: mockCacheService },
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Get task feat', () => {
    it('Should return a single task', async () => {
      const taskId = '1';

      mockDatabaseService.task.findUnique.mockResolvedValue(mockTask);

      const result = await service.getTaskById(taskId);

      expect(mockDatabaseService.task.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        data: mockTask,
      });
    });
  });

  describe('Delete user tasks feature', () => {
    it('Should delete all tasks for user and clear cache', async () => {
      mockDatabaseService.task.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.deleteAllTasks(mockPayload);

      expect(mockDatabaseService.task.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });

      expect(mockCacheService.deleteCache).toHaveBeenCalledWith('tasks:user:1');

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        message: 'All tasks are removed',
      });
    });
  });

  describe('Create a task route', () => {
    it('Should create a task and invalidate cache', async () => {
      const dto: Prisma.TaskCreateManyInput = {
        title: 'Stop all wars',
        userId: 1,
      };

      mockDatabaseService.task.create.mockResolvedValue(mockTask);

      const result = await service.createTask(dto, mockPayload);

      expect(mockDatabaseService.task.create).toHaveBeenCalledWith({
        data: dto,
      });

      expect(mockCacheService.deleteCache).toHaveBeenCalledWith('tasks:user:1');

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        message: 'Task is created.',
        data: mockTask,
      });
    });
  });

  describe('Update task row', () => {
    it('Should update a task and invalidate cache', async () => {
      const dto: Prisma.TaskUpdateInput = { title: 'Updated task' };
      const taskId = '1';

      mockDatabaseService.task.update.mockResolvedValue(mockTask);

      const result = await service.updateTask(dto, taskId, mockPayload);

      expect(mockDatabaseService.task.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto,
      });

      expect(mockCacheService.deleteCache).toHaveBeenCalledWith('tasks:user:1');

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        message: 'Task is updated.',
        data: mockTask,
      });
    });
  });

  describe('Get all user tasks feature', () => {
    it('Should get user tasks from database via cache if available', async () => {
      mockDatabaseService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getUserTasks(mockPayload);

      expect(mockCacheService.validateCache).toHaveBeenCalledWith(
        'tasks:user:1',
        expect.any(Function),
        3,
      );

      expect(mockDatabaseService.task.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: expect.objectContaining({ user: true }),
      });

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        data: mockTasks,
      });
    });
  });

  describe('Delete a specific task feat', () => {
    it('Should delete a task by id and invalidate cache', async () => {
      const taskId = '1';

      mockDatabaseService.task.delete.mockResolvedValue(mockTask);

      const result = await service.deleteTaskById(taskId, mockPayload);

      expect(mockDatabaseService.task.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(mockCacheService.deleteCache).toHaveBeenCalledWith('tasks:user:1');

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        message: 'Task is deleted.',
        data: mockTask,
      });
    });
  });
});
