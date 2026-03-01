import { Test } from '@nestjs/testing';
import { ReportsGateway } from './reports.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { Server } from 'ws';
import { UnauthorizedException } from '@nestjs/common';
import { TaskReport } from './types';
import { SocketEvent } from './enum';

type JWTPayload = { sub: number };

interface SocketResponse {
  event: SocketEvent;
  data?: any;
}

describe('ReportsGateway', () => {
  let gateway: ReportsGateway;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockServer: any;

  beforeEach(async () => {
    mockJwtService = {
      verify: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SOCKET') return 'jwt-socket-secret';
        return null;
      }),
    };

    mockServer = {
      on: jest.fn(),
      emit: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ReportsGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    gateway = module.get(ReportsGateway);
    gateway.server = mockServer;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('After init method', () => {
    it('Should log gateway initialized', () => {
      gateway.afterInit({} as any);
    });
  });

  describe('Connection handler', () => {
    it('Should close client with 1008 UnauthorizedException if no authorization header provided', () => {
      const client = {
        close: jest.fn(),
        send: jest.fn(),
      };

      gateway.handleConnection(client, { headers: {} });

      expect(client.close).toHaveBeenCalledWith(
        1008,
        new UnauthorizedException().message,
      );
      expect(client.send).not.toHaveBeenCalled();
    });

    it('Should close client with 1008 if token is missing after Bearer removal', () => {
      const client = {
        close: jest.fn(),
        send: jest.fn(),
      } as any;

      gateway.handleConnection(client, {
        headers: {
          authorization: 'Bearer ',
        },
      });

      expect(client.close).toHaveBeenCalledWith(
        1008,
        new UnauthorizedException().message,
      );
    });

    it('Should verify JWT and store client if token is valid', () => {
      const client = {
        close: jest.fn(),
        send: jest.fn(),
      } as any;

      const payload: JWTPayload = { sub: 1 };

      mockJwtService.verify.mockReturnValue(payload);

      gateway.handleConnection(client, {
        headers: {
          authorization: 'Bearer token',
        },
      });

      expect(mockJwtService.verify).toHaveBeenCalledWith('token', {
        secret: 'jwt-socket-secret',
      });

      expect((gateway as any).clients.get(1)).toBe(client);

      const firstCall = client.send.mock.calls[0][0];
      const parsed = JSON.parse(firstCall) as SocketResponse;

      expect(parsed.event).toBe(SocketEvent.AUTHENTICATION_SUCCESS);
      expect(client.close).not.toHaveBeenCalled();
    });

    it('Should handle invalide JWT token and close client', () => {
      const client = {
        close: jest.fn(),
        send: jest.fn(),
      } as any;

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid JWT signature');
      });

      gateway.handleConnection(client, {
        headers: {
          authorization: 'Bearer token',
        },
      });

      const firstCall = client.send.mock.calls[0][0];
      const parsed = JSON.parse(firstCall) as SocketResponse;

      expect(parsed.event).toBe(SocketEvent.AUTHENTICATION_FAILURE);
      expect(parsed.data).toBe('Invalid JWT signature');

      expect(client.close).toHaveBeenCalledWith(1008, 'Invalid JWT signature');
    });
  });

  describe('Socket on disconnect', () => {
    it('Should remove correct client when disconnected', () => {
      const client1 = { id: 1 } as unknown as WebSocket;
      const client2 = { id: 2 } as unknown as WebSocket;

      (gateway as any).clients.set(1, client1);
      (gateway as any).clients.set(2, client2);

      gateway.handleDisconnect(client1);

      expect((gateway as any).clients.has(1)).toBe(false);
      expect((gateway as any).clients.has(2)).toBe(true);
    });
  });

  describe('Send generated report to the client', () => {
    it('Should send report to client if client is connected to socket', async () => {
      const client = {
        send: jest.fn(),
        readyState: WebSocket.OPEN,
      };

      (gateway as any).clients.set(1, client);

      const report: TaskReport = {
        userId: 1,
        description: 'Tasks report',
        total: 1,
        createdAt: new Date(),
      };

      await gateway.sendReport(report);

      const firstCall = (client.send as jest.Mock).mock.calls[0][0];
      const parsed = JSON.parse(firstCall) as TaskReport;

      expect(parsed.userId).toBe(1);
      expect(parsed.description).toBe('Tasks report');
      expect(parsed.total).toBe(1);

      expect(parsed.createdAt).toEqual(report.createdAt.toISOString());
    });
  });
});
