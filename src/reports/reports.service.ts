import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { JobId, Queue } from 'bull';
import { JWTPayload, QueueName, ResponseStatus } from 'src/common';
import { ProcessName } from 'src/common/enum/process-name.enum';
import { ApiResponse } from 'src/common/types';

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
