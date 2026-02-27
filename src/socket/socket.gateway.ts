import {
  WebSocketGateway,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, WebSocket } from 'ws';
import { Req, UseFilters } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import { IncomingMessage } from 'http';
import { TasksService as SocketService } from 'src/tasks/tasks.service';
import { SocketExceptionsFilter } from 'src/filters/socket-exceptions.filter';
import { SocketResponse } from './types';

@WebSocketGateway(4000, {
  transports: ['websocket'],
  path: '/socket',
})
@UseFilters(SocketExceptionsFilter)
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly socketService: SocketService) {}

  @WebSocketServer()
  server: Server;

  private readonly logger = new LoggerService(SocketGateway.name);

  afterInit(server: Server) {
    this.logger.log(
      `[After Init] - [${JSON.stringify(server.address())}]`,
      SocketGateway.name,
    );
    // Subscribe to Socket service observable
    this.socketService
      .getWebSocketEventsObservable()
      .asObservable()
      .subscribe({
        next: (event) => {
          server.clients.forEach((client) => {
            client.send(
              JSON.stringify({
                event: event.name,
                data: event.data,
              } satisfies SocketResponse),
            );
          });
        },
        error: (error) => {
          server.clients.forEach((client) => {
            client.send(JSON.stringify({ event: 'error', payload: error }));
          });
        },
      });
  }

  handleConnection(@Req() request: IncomingMessage) {
    const ip = request.socket.remoteAddress;
    this.logger.log(`[Connection] - [${ip} connected]`, SocketGateway.name);
  }

  handleDisconnect(@ConnectedSocket() client: WebSocket) {
    this.logger.log(
      `[Disconnection] [${client} disconnected]`,
      SocketGateway.name,
    );
  }
}
