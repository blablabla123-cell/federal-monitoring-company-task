import { TestingModule, Test } from '@nestjs/testing';
import { JWTPayload, ResponseStatus } from '../common';
import { ApiResponse } from '../common/types';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      processReport: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(ReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Process report', () => {
    it('Should process report and return job id immediately', async () => {
      const payload: JWTPayload = { sub: 1 };

      const mockResponse: ApiResponse = {
        status: ResponseStatus.SUCCESS,
        message: 'Report is being processed. Please wait.',
        data: { jobId: '1' },
      };

      mockService.processReport.mockResolvedValue(mockResponse);

      const result = await controller.getUserTasks(payload);

      expect(mockService.processReport).toHaveBeenCalledWith(payload);
      expect(result).toEqual(mockResponse);
    });
  });
});
