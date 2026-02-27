import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard, GetTokenPayload } from 'src/authentication/common';
import { ReportsService } from './reports.service';
import { JWTPayload } from 'src/common';
import { ApiResponse } from 'src/common/types';

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
