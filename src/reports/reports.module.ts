import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { QueueName } from '../common';
import { DatabaseModule } from '../database/database.module';
import { ReportsConsumer } from './reports.consumer';
import { ReportsController } from './reports.controller';
import { ReportsGateway } from './reports.gateway';
import { ReportsService } from './reports.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue({
      name: QueueName.REPORTS,
    }),
    JwtModule.register({}),
  ],
  providers: [ReportsService, ReportsConsumer, ReportsGateway],
  controllers: [ReportsController],
  exports: [ReportsGateway],
})
export class ReportsModule {}
