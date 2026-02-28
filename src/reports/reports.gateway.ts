import { UseFilters, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { env } from 'process';
import { Server } from 'ws';
import { SocketExceptionsFilter } from '../filters/socket-exceptions.filter';
import { LoggerService } from '../logger/logger.service';
import { SocketEvent } from './enum';
import { Report, SocketResponse } from './types';

@WebSocketGateway(Number(env.SOCKET_PORT), {
  transports: ['websocket'],
  path: '/socket',
})
@UseFilters(SocketExceptionsFilter)
export class ReportsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit(server: any) {
    this.logger.log(`[Gateway initialized]`, ReportsGateway.name);
  }

  private readonly logger = new LoggerService(ReportsGateway.name);
  private clients: Map<number, WebSocket> = new Map();

  handleConnection(client: any, req: any) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      client.close(1008, new UnauthorizedException().message);
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      client.close(1008, new UnauthorizedException().message);
      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SOCKET'),
      });

      this.clients.set(payload.sub, client);

      client.send(
        JSON.stringify({
          event: SocketEvent.AUTHENTICATION_SUCCESS,
        } satisfies SocketResponse),
      );
    } catch (error) {
      this.logger.error('Invalid token:', error.message);
      client.send(
        JSON.stringify({
          event: SocketEvent.AUTHENTICATION_FAILURE,
          data: error.message,
        } satisfies SocketResponse),
      );
      client.close(1008, error.message);
    }
  }

  handleDisconnect(client: WebSocket) {
    for (const [key, value] of this.clients) {
      if (value === client) {
        this.clients.delete(key);
      }
    }
  }

  async sendReport(report: Report) {
    this.logger.log(`[Send report to client]`, ReportsGateway.name);
    const client = this.clients.get(report.userId);
    if (client?.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(report));
    }
  }
}
