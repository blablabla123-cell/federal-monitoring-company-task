import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { QueueName } from '../common';
import { ProcessName } from '../common/enum/process-name.enum';
import { ResponseStatus } from '../common';
import { getQueueToken } from '@nestjs/bull';

describe('ReportsService', () => {
  let service: ReportsService;
  let mockQueue: any;

  const mockPayload = { sub: 1 };

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
    };

    mockQueue.add.mockResolvedValue({ id: 1 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getQueueToken(QueueName.REPORTS),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Process report', () => {
    it('Should add a job to the reports queue and return job id', async () => {
      const result = await service.processReport(mockPayload);

      expect(mockQueue.add).toHaveBeenCalledWith(
        ProcessName.REPORTS_ANALYSIS,
        { userId: 1 },
        expect.objectContaining({
          delay: 1 * 1000,
          attempts: 3,
          backoff: 5 * 1000,
          removeOnComplete: 5,
          removeOnFail: 5,
        }),
      );

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        message: 'Report is being processed. Please wait.',
        data: { jobId: '1' },
      });
    });
  });
});
