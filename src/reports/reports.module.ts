import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsConsumer } from './reports.consumer';
import { DatabaseModule } from 'src/database/database.module';
import { BullModule } from '@nestjs/bull';
import { QueueName } from 'src/common';
import { ReportsController } from './reports.controller';
import { ReportsGateway } from './reports.gateway';
import { JwtModule } from '@nestjs/jwt';

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
