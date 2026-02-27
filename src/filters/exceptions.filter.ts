import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';
import { ErrorResponse } from './type';
import { ApiResponse } from 'src/common/types';
import { ResponseStatus } from 'src/common';

@Catch()
export class ExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new LoggerService(ExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.log(`[${request.url}]`, ExceptionsFilter.name);

    const responseObject: ErrorResponse = {
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof HttpException) {
      this.logger.log(
        `[${request.url}] [${exception.getResponse()['message']}]`,
        ExceptionsFilter.name,
      );
      responseObject.statusCode = exception.getStatus();
      responseObject.error = exception.getResponse();
    } else if (exception instanceof PrismaClientValidationError) {
      responseObject.statusCode = 422;
      responseObject.error = exception.message.replaceAll(/\n/g, '');
    } else {
      responseObject.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    const apiResponse = {
      status: ResponseStatus.FAILURE,
      data: responseObject,
    } satisfies ApiResponse;

    response.status(responseObject.statusCode);
    response.send(apiResponse);
    this.logger.error(responseObject.error, ExceptionsFilter.name);

    super.catch(exception, host);
  }
}
