import { createCorsOptions } from './cors.config';

function resolveOrigin(
  origin: string | undefined,
  environment: NodeJS.ProcessEnv,
): Promise<unknown> {
  const options = createCorsOptions(environment);
  const originValidator = options.origin;

  if (typeof originValidator !== 'function') {
    throw new Error('Expected a dynamic CORS origin validator.');
  }

  return new Promise((resolve, reject) => {
    originValidator(origin, (error, allowedOrigin) => {
      if (error instanceof Error) {
        reject(error);
        return;
      }

      resolve(allowedOrigin);
    });
  });
}

describe('createCorsOptions', () => {
  const validEnvironment = {
    CORS_ORIGINS: 'http://localhost:3001, http://127.0.0.1:3001',
    CORS_CREDENTIALS: 'true',
  };

  it('accepts configured origins and credentials', async () => {
    const options = createCorsOptions(validEnvironment);

    expect(options.credentials).toBe(true);
    expect(options.methods).toEqual([
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ]);
    expect(options.allowedHeaders).toEqual([
      'Content-Type',
      'Authorization',
      'Accept',
    ]);
    await expect(
      resolveOrigin('http://localhost:3001', validEnvironment),
    ).resolves.toBe(true);
    await expect(
      resolveOrigin('http://127.0.0.1:3001', validEnvironment),
    ).resolves.toBe(true);
  });

  it('does not grant CORS access to an unconfigured origin or requests without Origin', async () => {
    await expect(
      resolveOrigin('http://malicious.example', validEnvironment),
    ).resolves.toBe(false);
    await expect(resolveOrigin(undefined, validEnvironment)).resolves.toBe(
      false,
    );
  });

  it.each([
    [
      { CORS_ORIGINS: '' },
      'CORS_ORIGINS must define at least one allowed origin.',
    ],
    [
      { CORS_ORIGINS: 'http://localhost:3001,' },
      'CORS_ORIGINS must not contain empty entries.',
    ],
    [{ CORS_ORIGINS: '*' }, 'CORS_ORIGINS must not contain a wildcard origin.'],
    [
      { CORS_ORIGINS: 'http://localhost:3001,http://localhost:3001' },
      'CORS_ORIGINS must not contain duplicate origins.',
    ],
    [
      { CORS_ORIGINS: 'http://localhost:3001/path' },
      'CORS_ORIGINS must contain exact HTTP(S) origins: http://localhost:3001/path',
    ],
    [
      { CORS_CREDENTIALS: 'invalid' },
      'CORS_CREDENTIALS must be either true or false.',
    ],
  ])('fails fast for invalid configuration %#', (overrides, message) => {
    expect(() =>
      createCorsOptions({ ...validEnvironment, ...overrides }),
    ).toThrow(message);
  });
});
