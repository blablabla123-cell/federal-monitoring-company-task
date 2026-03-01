import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ResponseStatus } from '../src/common';

describe('App e2e flow test', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Signs up user', async () => {
    const testEmail = `app-e2e-${Date.now()}@mail.ru`;

    const response = await request(app.getHttpServer())
      .post('/authentication/sign-up')
      .send({
        email: testEmail,
        password: 'password',
        name: 'Dwayne Johnson',
      })
      .expect(201);

    expect(response.body.status).toBe(ResponseStatus.SUCCESS);
    accessToken = response.body.data.accessToken;
  });

  it('Gets user profile with socket token', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.status).toBe(ResponseStatus.SUCCESS);
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.socketToken).toBeDefined();
  });

  it('Process report returns job id', async () => {
    const response = await request(app.getHttpServer())
      .get('/reports/')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.status).toBe(ResponseStatus.SUCCESS);
    expect(response.body.data.jobId).toBeDefined();
  });
});
