import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { APP_GUARD } from '@nestjs/core';

describe('App e2e (GET only + reports)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: APP_GUARD,
          useClass: class {
            canActivate() {
              return true;
            }
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1'); 
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeAll(async () => {
    const email = `e2e-${Date.now()}@test.com`;

    const { body } = await request(app.getHttpServer())
      .post('/v1/authentication/sign-up')
      .send({
        email,
        password: 'testpassword',
        name: 'E2E Tester',
      })
      .expect(201);

    accessToken = body.data.accessToken;
  });

  describe('GET routes', () => {
    it('(GET /tasks) should list tasks', async () => {
      await request(app.getHttpServer())
        .get('/v1/tasks/my')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('(GET /tasks/:id) should get one task', async () => {
      const createdTaskId = 1; 
      await request(app.getHttpServer())
        .get(`/v1/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('Reports', () => {
    it('(GET /reports/) should trigger report generation', async () => {
      await request(app.getHttpServer())
        .get('/v1/reports/')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });
});
