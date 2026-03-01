import { WsAdapter } from '@nestjs/platform-ws';
import { Server } from 'http';

export class TestWsAdapter extends WsAdapter {
  private server: Server;

  public create(port: number, options?: any) {
    const socketPort = Number(process.env.SOCKET_PORT || 4000);

    this.server = super.create(socketPort, {
      ...options,
      path: '/test-ws',
    });
    return this.server;
  }

  close(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
    return;
  }
}
