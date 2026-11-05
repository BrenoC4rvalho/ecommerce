import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';

function validationDetails(errors: ValidationError[]): unknown[] {
  return errors.map(({ property, constraints, children }) => ({
    property,
    constraints: constraints ? Object.values(constraints) : [],
    children: children?.length ? validationDetails(children) : undefined,
  }));
}

export function createAppValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new BadRequestException({
        error: 'Bad Request',
        message: 'Validation failed',
        details: validationDetails(errors),
      }),
  });
}
