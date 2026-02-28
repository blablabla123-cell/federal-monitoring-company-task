import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExceptionsFilter } from './filters/exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WsAdapter } from './adapters/ws.adapter';
import {
  BadRequestException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { env } from 'process';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Task manager API')
    .setDescription('A list of endpoints to work with Task manager')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const firstError = errors[0];
        const firstConstraint = Object.values(firstError.constraints)[0];

        return new BadRequestException({
          message: firstConstraint,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      },
    }),
  );

  app.useWebSocketAdapter(new WsAdapter());

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new ExceptionsFilter(httpAdapter));

  app.setGlobalPrefix('v1');

  await app.listen(Number(env.PORT) || 3000);
}

bootstrap();
