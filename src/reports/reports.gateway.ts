import {
  Req,
  UnauthorizedException,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { env } from 'node:process';
import { SocketExceptionsFilter } from 'src/filters/socket-exceptions.filter';
import { LoggerService } from 'src/logger/logger.service';
import { Server, WebSocket } from 'ws';
import { Report, SocketResponse } from './types';
import { JwtService } from '@nestjs/jwt';
import { InvalidAccessTokenException } from 'src/exceptions';
import { SocketEvent } from './enum';
import { ConfigService } from '@nestjs/config';

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
    const token = authHeader?.replace('Bearer ', '');

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
      client.close(1008, new InvalidAccessTokenException().message);
    }
  }

  handleDisconnect(client: WebSocket) {
    const userId = (client as any).user?.sub;
    if (userId) this.clients.delete(userId);
  }

  async sendReport(report: Report) {
    this.logger.log(`[Send report ${report.userId}]`, ReportsGateway.name);
    const client = this.clients.get(report.userId);
    if (client?.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(report));
    }
  }
}
