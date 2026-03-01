import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestWsAdapter } from './test-ws.adapter';

describe('AuthenticationModule (e2e)', () => {
  let app: INestApplication;
  let testUserEmail: string;
  let testRefreshToken: string;

  beforeAll(async () => {
    process.env.SOCKET_PORT = '7500';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useWebSocketAdapter(new TestWsAdapter());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    testUserEmail = `e2e-${Date.now()}@mail.ru`;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Sign up request', () => {
    it('Should create a user and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/sign-up')
        .send({
          email: testUserEmail,
          password: 'password',
          name: 'Will Smith',
        })
        .expect(201);

      expect(response.body).toEqual({
        status: expect.any(String),
        message: 'User successfully signed up.',
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('Should fail when trying to create the same user with the same email', async () => {
      testUserEmail = `e2e-${Date.now()}@mail.ru`;

      await request(app.getHttpServer())
        .post('/authentication/sign-up')
        .send({
          email: testUserEmail,
          password: 'password',
          name: 'Johnie Depp',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/authentication/sign-up')
        .send({
          email: testUserEmail,
          password: 'password',
          name: 'Johnie Depp',
        })
        .expect(409);
    });

    it('Should fail with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/authentication/sign-up')
        .send({})
        .expect(400);
    });
  });

  describe('Sign in feature', () => {
    beforeEach(async () => {
      await request(app.getHttpServer()).post('/authentication/sign-up').send({
        email: 'test@mail.ru',
        password: 'password',
        name: 'Megan Fox',
      });
    });

    it('Should sign user in and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/sign-in')
        .send({
          email: 'test@mail.ru',
          password: 'password',
        })
        .expect(200);

      expect(response.body).toEqual({
        status: expect.any(String),
        message: 'User successfully signed in.',
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      testRefreshToken = response.body.data.refreshToken;
    });

    it('Should fail with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/authentication/sign-in')
        .send({
          email: 'test@mail.ru',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('Should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/authentication/sign-in')
        .send({
          email: 'hacker@mail.ru',
          password: 'password',
        })
        .expect(404);
    });
  });

  describe('Refresh feat', () => {
    it('Should issue a new at', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/refresh')
        .set('Authorization', `Bearer ${testRefreshToken}`)
        .expect(200);

      expect(response.body).toEqual({
        status: expect.any(String),
        data: {
          accessToken: expect.any(String),
        },
      });
    });

    it('Should fail with invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/authentication/refresh')
        .set('Authorization', `Bearer invalid_access_token`)
        .expect(401);
    });
  });

  describe('Reset feat', () => {
    testUserEmail = `e2e-${Date.now()}@mail.ru`;
    beforeEach(async () => {
      await request(app.getHttpServer()).post('/authentication/sign-up').send({
        email: testUserEmail,
        password: 'password',
        name: 'Nick Fury',
      });
    });

    it('Should reset password successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/authentication/reset-password')
        .send({
          email: testUserEmail,
          password: 'newpassword',
        })
        .expect(200);

      expect(response.body).toEqual({
        status: expect.any(String),
        message: 'Password has been reset.',
      });
    });

    it('Should fail if user is not found', async () => {
      await request(app.getHttpServer())
        .post('/authentication/reset-password')
        .send({
          email: 'somerandom@mail.ru',
          password: 'newpassword',
        })
        .expect(404);
    });
  });
});
