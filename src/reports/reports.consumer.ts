import { Process, Processor } from '@nestjs/bull';
import { Report } from './types/report.type';
import { Job } from 'bull';
import { Task } from '@prisma/client';
import { ReportsGateway } from './reports.gateway';
import { DatabaseService } from '../database/database.service';
import { LoggerService } from '../logger/logger.service';
import { ProcessName } from '../common/enum/process-name.enum';
import { QueueName } from '../common';

@Processor(QueueName.REPORTS)
export class ReportsConsumer {
  constructor(
    private readonly database: DatabaseService,
    private readonly reportsGateway: ReportsGateway,
  ) {}

  private readonly logger = new LoggerService(ReportsConsumer.name);

  @Process(ProcessName.REPORTS_ANALYSIS)
  async handleReportAnalysis(job: Job) {
    const { userId } = job.data;

    this.logger.log(`[Process report analysis]`, ReportsConsumer.name);

    const tasks = await this.database.task.findMany({
      where: { userId },
    });

    const report = this.performHeavyTask(tasks, userId);

    await this.reportsGateway.sendReport(report);

    return report;
  }

  private performHeavyTask(tasks: Task[], userId: number) {
    this.logger.log(`[Perform heavy task]`, ReportsConsumer.name);

    const start = performance.now();

    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.random() * i * tasks.length;
    }

    const end = performance.now();
    this.logger.log(`[Task took ${end - start} ms]`, ReportsConsumer.name);

    return {
      userId: userId,
      createdAt: new Date(),
      description: 'Report analysis',
      total: tasks.length,
    } satisfies Report;
  }
}
