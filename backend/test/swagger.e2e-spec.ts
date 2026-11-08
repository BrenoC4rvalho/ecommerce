/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('Swagger documentation (e2e)', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addCookieAuth('cart_session_id').build(),
    );
  });

  afterAll(async () => app.close());

  it('documents DTO properties and product search examples', () => {
    expect(document).toMatchObject({
      components: {
        schemas: {
          CreateProductDto: {
            properties: {
              name: { example: 'Fone Bluetooth Pulse Pro' },
              price: { example: '349.90' },
              stock: { example: 38 },
              isActive: { example: true },
            },
          },
        },
      },
      paths: {
        '/products': {
          get: {
            parameters: expect.arrayContaining([
              expect.objectContaining({ name: 'search', in: 'query' }),
              expect.objectContaining({ name: 'page', in: 'query' }),
              expect.objectContaining({ name: 'limit', in: 'query' }),
            ]),
            responses: {
              200: {
                content: {
                  'application/json': {
                    examples: { pesquisaSemResultados: expect.anything() },
                  },
                },
              },
            },
          },
        },
      },
    });
  });

  it('documents cart cookies and checkout public order numbers', () => {
    expect(document.paths['/carts'].post).not.toHaveProperty('security');

    expect(document).toMatchObject({
      components: {
        securitySchemes: {
          cookie: { in: 'cookie', name: 'cart_session_id' },
        },
      },
      paths: {
        '/carts/{id}': { get: { security: [{ cart_session_id: [] }] } },
        '/orders/checkout': {
          post: {
            responses: {
              201: {
                content: {
                  'application/json': {
                    schema: {
                      example: expect.objectContaining({
                        orderNumber: 'PED-2026-000123',
                      }),
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  });
});
