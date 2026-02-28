import {
  Controller,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AccessTokenGuard, GetTokenPayload } from '../authentication/common';
import { JWTPayload } from '../common';
import { ApiResponse } from '../common/types';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @UseGuards(AccessTokenGuard)
  @Get('/')
  @HttpCode(HttpStatus.OK)
  getUserTasks(@GetTokenPayload() payload: JWTPayload): Promise<ApiResponse> {
    return this.reportsService.processReport(payload);
  }
}
