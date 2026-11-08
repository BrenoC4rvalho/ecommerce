import { Controller, Get, INestApplication, Post, Res } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import request from 'supertest';
import { App } from 'supertest/types';
import { createCorsOptions } from './../src/common/config/cors.config';

@Controller('cors-test')
class CorsTestController {
  @Get()
  findAll() {
    return { ok: true };
  }

  @Post()
  create(@Res({ passthrough: true }) response: Response) {
    response.cookie('test_session', 'session-id', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    });

    return { ok: true };
  }
}

describe('CORS policy (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CorsTestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors(
      createCorsOptions({
        CORS_ORIGINS: 'http://localhost:3001',
        CORS_CREDENTIALS: 'true',
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('allows GET and POST requests from an authorized origin with credentials', async () => {
    await request(app.getHttpServer())
      .get('/cors-test')
      .set('Origin', 'http://localhost:3001')
      .expect(200)
      .expect('Access-Control-Allow-Origin', 'http://localhost:3001')
      .expect('Access-Control-Allow-Credentials', 'true');

    const response = await request(app.getHttpServer())
      .post('/cors-test')
      .set('Origin', 'http://localhost:3001')
      .expect(201)
      .expect('Access-Control-Allow-Origin', 'http://localhost:3001')
      .expect('Access-Control-Allow-Credentials', 'true');

    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('HttpOnly')]),
    );
  });

  it('does not grant CORS access to an unauthorized origin', async () => {
    const response = await request(app.getHttpServer())
      .get('/cors-test')
      .set('Origin', 'http://malicious.example')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(
      response.headers['access-control-allow-credentials'],
    ).toBeUndefined();
  });

  it('serves non-browser requests without granting CORS access', async () => {
    const response = await request(app.getHttpServer())
      .get('/cors-test')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('responds to an authorized preflight request', () => {
    return request(app.getHttpServer())
      .options('/cors-test')
      .set('Origin', 'http://localhost:3001')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,authorization')
      .expect(204)
      .expect('Access-Control-Allow-Origin', 'http://localhost:3001')
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect('Access-Control-Allow-Methods', /GET/)
      .expect('Access-Control-Allow-Headers', /content-type/i);
  });
});
