import { WebSocketAdapter, WsMessageHandler } from '@nestjs/common';
import { fromEvent, mergeMap, Observable } from 'rxjs';
import { LoggerService } from 'src/logger/logger.service';
import { WebSocket } from 'ws';

export class WsAdapter implements WebSocketAdapter {
  private readonly logger = new LoggerService(WsAdapter.name);

  create(port: number, options?: any) {
    this.logger.log(`[PORT: ${port}]`, WsAdapter.name);
    return new WebSocket.Server({ port, ...options });
  }

  bindClientConnect(server: any, callback: Function) {
    this.logger.log(`[On client connection]`, WsAdapter.name);
    server.on('connection', callback);
  }

  bindClientDisconnect?(client: any, callback: Function) {
    this.logger.log(`[On client disconnection]`, WsAdapter.name);
    client.on('close', callback);
  }

  bindMessageHandlers(
    client: any,
    handlers: WsMessageHandler[],
    transform: (data: any) => Observable<any>,
  ) {
    this.logger.log(`[Message]`, WsAdapter.name);
    fromEvent(client, 'message')
      .pipe(mergeMap((data) => transform(JSON.parse(data.toString()))))
      .subscribe({
        next: function (response) {
          this.logger.log(`[${JSON.stringify(response)}]`, WsAdapter.name);
          return client.send(JSON.stringify(response));
        },
        error: (err) => this.logger.error('Error handling message:', err),
      });
  }

  close(server: any) {
    this.logger.log(`[Server closed]`, WsAdapter.name);
    server.close();
  }
}
