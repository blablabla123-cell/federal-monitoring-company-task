import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { CacheService } from '../cache/cache.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TasksController],
  providers: [TasksService, CacheService],
  exports: [TasksService],
})
export class TasksModule {}
