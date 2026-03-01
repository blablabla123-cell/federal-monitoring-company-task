import { Test } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';
import { ExceptionsFilter } from './exceptions.filter';
import { LoggerService } from '../logger/logger.service';
import { ApiResponse } from '../common/types';
import { ResponseStatus } from '../common';
const requestMock = () => ({
  url: '/test-url',
});

const responseMock = () => {
  const mockJson = jest.fn();
  const mockStatus = jest.fn().mockImplementation((status) => ({
    status,
    send: mockJson,
  }));

  return {
    status: mockStatus,
    send: mockJson,
  };
};

export const contextMock = (): ArgumentsHost => {
  const ctx: any = {};
  ctx.switchToHttp = jest.fn().mockReturnValue({
    getRequest: jest.fn().mockReturnValue(requestMock()),
    getResponse: jest.fn().mockReturnValue(responseMock()),
  });
  ctx.getHandler = jest.fn();
  ctx.getArgs = jest.fn();
  ctx.getArgByIndex = jest.fn();
  ctx.getType = jest.fn();
  ctx.switchToRpc = jest.fn();
  ctx.switchToWs = jest.fn();

  return ctx as ArgumentsHost;
};

describe('ExceptionsFilter', () => {
  let filter: ExceptionsFilter;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExceptionsFilter,
        {
          provide: LoggerService,
          useClass: LoggerService,
        },
      ],
    }).compile();

    filter = module.get<ExceptionsFilter>(ExceptionsFilter);

    jest.spyOn(filter['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(filter['logger'], 'error').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('Handle HttpException', () => {
    it('Should respond with error', () => {
      const ctxMock = contextMock();
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      filter.catch(exception, ctxMock);

      expect(ctxMock.switchToHttp).toHaveBeenCalled();
      expect(ctxMock.switchToHttp().getResponse).toHaveBeenCalled();

      const response = ctxMock.switchToHttp().getResponse();
      expect(response.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(response.send).toHaveBeenCalled();

      const apiResponse = response.send.mock.calls[0][0] as ApiResponse;
      expect(apiResponse.status).toEqual(ResponseStatus.FAILURE);
      expect(apiResponse.data).toMatchObject({
        statusCode: HttpStatus.FORBIDDEN,
        path: '/test-url',
        error: 'Forbidden',
      });
    });
  });

  describe('Handle PrismaClientValidationError', () => {
    it('Should respond with 422 and error message', () => {
      const ctxMock = contextMock();
      const exception = new PrismaClientValidationError('Invalid input', {
        clientVersion: '1.0.0',
      });

      filter.catch(exception, ctxMock);

      const response = ctxMock.switchToHttp().getResponse();
      expect(response.status).toHaveBeenCalledWith(422);
      expect(response.send).toHaveBeenCalled();

      const apiResponse = response.send.mock.calls[0][0] as ApiResponse;
      expect(apiResponse.status).toEqual(ResponseStatus.FAILURE);
      expect(apiResponse.data).toMatchObject({
        statusCode: 422,
        error: 'Invalid input',
      });
    });
  });

  describe('Should handle Internal Server Error', () => {
    it('Should respond with 500 and generic error', () => {
      const ctxMock = contextMock();
      const exception = new Error('Unexpected');

      filter.catch(exception, ctxMock);

      const response = ctxMock.switchToHttp().getResponse();
      expect(response.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(response.send).toHaveBeenCalled();

      const apiResponse = response.send.mock.calls[0][0] as ApiResponse;
      expect(apiResponse.status).toEqual(ResponseStatus.FAILURE);
      expect(apiResponse.data).toMatchObject({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });
});
