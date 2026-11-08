import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorResponse = {
  statusCode: number;
  error: string;
  message: string | string[];
  details?: unknown;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const payload = this.toPayload(statusCode, exceptionResponse);

      response.status(statusCode).json(payload);
      return;
    }

    this.logger.error(
      `Unexpected error while handling ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    } satisfies ErrorResponse);
  }

  private toPayload(
    statusCode: number,
    exceptionResponse: string | object,
  ): ErrorResponse {
    if (typeof exceptionResponse === 'string') {
      return {
        statusCode,
        error: HttpStatus[statusCode] ?? 'Error',
        message: exceptionResponse,
      };
    }

    const response = exceptionResponse as {
      error?: string;
      message?: string | string[];
      details?: unknown;
    };

    return {
      statusCode,
      error: response.error ?? HttpStatus[statusCode] ?? 'Error',
      message: response.message ?? 'Request failed',
      ...(response.details === undefined ? {} : { details: response.details }),
    };
  }
}
