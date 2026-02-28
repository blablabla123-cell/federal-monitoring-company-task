import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { QueueName, JWTPayload, ResponseStatus } from '../common';
import { ProcessName } from '../common/enum/process-name.enum';
import { ApiResponse } from '../common/types';

@Injectable()
export class ReportsService {
  constructor(
    @InjectQueue(QueueName.REPORTS) private readonly reportsQueue: Queue,
  ) {}

  async processReport(payload: JWTPayload): Promise<ApiResponse> {
    const userId = payload.sub;
    const job = await this.reportsQueue.add(
      ProcessName.REPORTS_ANALYSIS,
      {
        userId,
      },
      {
        delay: 1 * 1000,
        attempts: 3,
        backoff: 5 * 1000,
        removeOnComplete: 5,
        removeOnFail: 5,
      },
    );

    return {
      status: ResponseStatus.SUCCESS,
      message: 'Report is being processed. Please wait.',
      data: { jobId: job.id.toString() },
    };
  }
}
