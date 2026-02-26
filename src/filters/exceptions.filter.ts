import { Catch, ArgumentsHost, HttpException } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Request, Response } from "express";
import { LoggerService } from "../logger/logger.service";
import { PrismaClientValidationError } from "@prisma/client/runtime/library";

type ResponseObject = {
  statusCode: number;
  timestamp: string;
  path: string;
  response: string | object;
};

@Catch()
export class ExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new LoggerService(ExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.log(
      `[Exceptions filter] [${request.url}]`,
      ExceptionsFilter.name,
    );

    // const responseObject: ResponseObject = {
    //   statusCode: 500,
    //   timestamp: new Date().toISOString(),
    //   path: request.url,
    //   response: '',
    // };

    if (exception instanceof HttpException) {
      this.logger.log(
        `[Exceptions filter] [${request.url}] [${exception.getResponse()["message"]}]`,
        ExceptionsFilter.name,
      );
      //   this.logger.log(`[Exceptions filter] [HTTP Exception] [${JSON.stringify(exception.getResponse())}]`, ExceptionsFilter.name);
      //   responseObject.statusCode = exception.getStatus();
      //   responseObject.response = exception.getResponse();
    } else if (exception instanceof PrismaClientValidationError) {
      //   responseObject.statusCode = 422;
      //   responseObject.response = exception.message.replaceAll(/\n/g, '');
    } else {
      //   responseObject.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      //   responseObject.response = 'Internal Server Error';
    }

    // response.status(responseObject.statusCode).json(responseObject);
    // this.logger.error(responseObject.response, ExceptionsFilter.name);

    super.catch(exception, host);
  }
}
