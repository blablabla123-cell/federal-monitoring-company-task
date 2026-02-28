import { Test, TestingModule } from '@nestjs/testing';
import { ReportsConsumer } from './reports.consumer';
import { ReportsGateway } from './reports.gateway';
import { DatabaseService } from '../database/database.service';
import { Task } from '@prisma/client';

describe('ReportsConsumer', () => {
  let consumer: ReportsConsumer;
  let mockDatabase: jest.Mocked<DatabaseService>;
  let mockGateway: jest.Mocked<ReportsGateway>;

  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'Task 1',
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ] satisfies Task[];

  beforeEach(() => {
    const mockTaskFindMany = jest.fn().mockResolvedValue(mockTasks);

    mockDatabase = {
      task: {
        findMany: mockTaskFindMany,
      },
    } as unknown as jest.Mocked<DatabaseService>;

    mockGateway = {
      sendReport: jest.fn(),
    } as unknown as jest.Mocked<ReportsGateway>;

    consumer = new ReportsConsumer(mockDatabase, mockGateway);
  });

  it('should fetch tasks, perform heavy task, send report, and return it', async () => {
    const userId = 1;
    const job = {
      id: 123,
      data: { userId },
    } as any;

    const report = await consumer.handleReportAnalysis(job);

    expect(mockDatabase.task.findMany).toHaveBeenCalledWith({
      where: { userId },
    });
    expect(mockGateway.sendReport).toHaveBeenCalledWith(report);

    expect(report.userId).toBe(userId);
    expect(report.total).toBe(mockTasks.length);
    expect(report.description).toBe('Report analysis');
    expect(report.createdAt).toBeInstanceOf(Date);
  });
});
