import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class SocketExceptionsFilter extends BaseWsExceptionFilter {
  private readonly logger = new LoggerService(SocketExceptionsFilter.name);
  catch(exception: any, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient();
    const data = host.switchToWs().getData();
    client.send(
      JSON.stringify({
        event: 'error',
      }),
    );
    this.logger.log(
      `[Weboscket Exceptions Filter] - [${client}] - [${data}] [${exception}]`,
      SocketExceptionsFilter.name,
    );
    super.catch(exception, host);
  }
}
