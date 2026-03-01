import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ResponseStatus } from '../src/common';
import { TestWsAdapter } from './test-ws.adapter';

describe('UsersModule (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    process.env.SOCKET_PORT = '6500';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useWebSocketAdapter(new TestWsAdapter());
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    const testUserEmail = `users-e2e-${Date.now()}@mail.ru`;

    const signupRes = await request(app.getHttpServer())
      .post('/authentication/sign-up')
      .send({
        email: testUserEmail,
        password: 'password',
        name: 'Kim Kardashian',
      });

    accessToken = signupRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Get user', () => {
    it('Get user and sign ws jwt token', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.status).toBe(ResponseStatus.SUCCESS);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.socketToken).toBeDefined();
    });
  });

  describe('Update user data', () => {
    it('Should update and return a user', async () => {
      const response = await request(app.getHttpServer())
        .put('/users/edit-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Rihanna' })
        .expect(200);

      expect(response.body.status).toBe(ResponseStatus.SUCCESS);
      expect(response.body.data.name).toBe('Rihanna');
    });
  });

  describe('User logout', () => {
    it('Clear rt hash and send success message', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/log-out')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.status).toBe(ResponseStatus.SUCCESS);
      expect(response.body.message).toContain('User successfully logged out.');
    });
  });

  describe('Delete account', () => {
    it('Delete the account and return success message', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.status).toBe(ResponseStatus.SUCCESS);
      expect(response.body.message).toContain(
        'Your account is deleted successfully.',
      );
    });
  });

  describe('Unauthorized access', () => {
    it('If we hit it without at we get back 401', async () => {
      await request(app.getHttpServer()).get('/users').expect(401);
    });
  });
});
