import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ResponseStatus } from '../src/common';
import { TestWsAdapter } from './test-ws.adapter';

describe('ReportsModule (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    process.env.SOCKET_PORT = '9500';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useWebSocketAdapter(new TestWsAdapter());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const testUserEmail = `reports-e2e-${Date.now()}@mail.ru`;

    const signupRes = await request(app.getHttpServer())
      .post('/authentication/sign-up')
      .send({
        email: testUserEmail,
        password: 'password',
        name: 'Jim Carrey',
      });

    accessToken = signupRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Get reports', () => {
    it('Returns report job id', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports/')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.status).toBe(ResponseStatus.SUCCESS);
      expect(response.body.data.jobId).toBeDefined();
    });
  });
});
