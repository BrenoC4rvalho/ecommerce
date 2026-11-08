import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ method: 'GET', url: '/products' }),
    }),
  } as unknown as ArgumentsHost;

  beforeEach(() => jest.clearAllMocks());

  it('keeps the status and validation details for HTTP errors', () => {
    new HttpExceptionFilter().catch(
      new BadRequestException({
        error: 'Bad Request',
        message: 'Validation failed',
        details: [{ property: 'name' }],
      }),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      details: [{ property: 'name' }],
    });
  });

  it('hides implementation details for unexpected errors', () => {
    new HttpExceptionFilter().catch(
      new Error('SELECT password FROM users'),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  });
});
