import { WsAdapter } from '@nestjs/platform-ws';

export class TestWsAdapter extends WsAdapter {
  public create(port: number) {
    const socketPort = Number(process.env.SOCKET_PORT || 4000);
    return super.create(socketPort, {
      path: '/test-socket',
    });
  }
}
