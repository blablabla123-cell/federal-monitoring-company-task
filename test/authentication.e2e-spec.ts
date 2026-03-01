import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { ResponseStatus } from '../src/common';
import { TestWsAdapter } from './test-ws.adapter';

describe('Authentication E2E', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  const testUser = {
    email: 'test@mail.ru',
    password: 'password',
    name: 'Vladimir Putin',
  };

  let accessToken: string;
  let refreshToken: string;
  let adapter: TestWsAdapter;

  beforeAll(async () => {
       process.env.SOCKET_PORT = '6500';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    adapter = new TestWsAdapter();
    app.useWebSocketAdapter(adapter);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    databaseService = moduleFixture.get(DatabaseService);

    await databaseService.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  afterAll(async () => {
    await databaseService.user.deleteMany({
      where: { email: testUser.email },
    });
    await app.close();
    await adapter.close();
    await databaseService.$disconnect();
  });

  describe('Registration feature', () => {
    it('Shour return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/sign-up')
        .send(testUser)
        .expect(201);

      expect(response.body.status).toBe(ResponseStatus.SUCCESS);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('Should fail if user already exists', async () => {
      await request(app.getHttpServer())
        .post('/authentication/sign-up')
        .send(testUser)
        .expect(409);
    });
  });

  describe('Sign in feature', () => {
    it('Should return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/sign-in')
        .send(testUser)
        .expect(200);

      expect(response.body.status).toBe(ResponseStatus.SUCCESS);

      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
    });

    it('Should fail with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/authentication/sign-in')
        .send({
          email: testUser.email,
          password: 'invalidpassword',
        })
        .expect(401);
    });
  });

  describe('Refresh feature', () => {
    it('Should refresh access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200);

      expect(response.body.status).toBe(ResponseStatus.SUCCESS);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('Should fail with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/authentication/refresh')
        .set('Authorization', `Bearer invalidtoken`)
        .expect(401);
    });
  });

  describe('Reset password feature', () => {
    it('Should reset password', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/reset-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: testUser.email,
          password: 'updatedpassword',
        })
        .expect(200);

      expect(response.body.status).toBe(ResponseStatus.SUCCESS);
    });

    it('Should sign in with updated password', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/sign-in')
        .send({
          email: testUser.email,
          password: 'updatedpassword',
        })
        .expect(200);

      expect(response.body.data.accessToken).toBeDefined();
    });
  });
});
