import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Res, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ResponseStatus } from '../src/common';
import { TestWsAdapter } from './test-ws.adapter';

describe('TasksModule (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let taskId: number;

  beforeAll(async () => {
    process.env.SOCKET_PORT = '2500';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useWebSocketAdapter(new TestWsAdapter());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const testUserEmail = `tasks-e2e-${Date.now()}@mail.ru`;

    const signupRes = await request(app.getHttpServer())
      .post('/authentication/sign-up')
      .send({
        email: testUserEmail,
        password: 'password',
        name: 'Harry Potter',
      });

    accessToken = signupRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Create task', () => {
    it('Creating a task should return it back', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Clean the room',
          userId: 1,
        })
        .expect(201);

      expect(response.body.status).toBe(ResponseStatus.SUCCESS);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.title).toBe('Clean the room');
    });
  });

  describe('Get user tasks', () => {
    it('Returns all user tasks', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Get rich or die trying',
          userId: 1,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/tasks/my')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.status).toBe(ResponseStatus.SUCCESS);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Get specific task', () => {
    it('Returns a task', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Morning routine', userId: 1 });

      taskId = createRes.body.data.id;

      const response = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.status).toBe(ResponseStatus.SUCCESS);
      expect(response.body.data.id).toBe(taskId);
    });
  });

  describe('Update task', () => {
    it('It should update the task and return it', async () => {
      const response = await request(app.getHttpServer())
        .put(`/tasks/update/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Sober today' })
        .expect(200);

      expect(response.body.status).toBe(ResponseStatus.SUCCESS);
      expect(response.body.data.title).toBe('Sober today');
    });
  });

  describe('Delete task', () => {
    it('Returns a task', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.status).toBe(ResponseStatus.SUCCESS);
      expect(response.body.message).toBe('Task is deleted.');
    });
  });

  describe('Delete all tasks', () => {
    it('Returns a message', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Task 1', userId: 1 });

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Task 2', userId: 1 });

      const response = await request(app.getHttpServer())
        .delete('/tasks/delete-all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.status).toBe(ResponseStatus.SUCCESS);
      expect(response.body.message).toBe('All tasks are removed');
    });
  });
});
