import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const allowedHeaders = ['Content-Type', 'Authorization', 'Accept'];

function parseOrigins(value: string | undefined): string[] {
  if (!value?.trim()) {
    throw new Error('CORS_ORIGINS must define at least one allowed origin.');
  }

  const origins = value.split(',').map((origin) => origin.trim());

  if (origins.some((origin) => !origin)) {
    throw new Error('CORS_ORIGINS must not contain empty entries.');
  }

  for (const origin of origins) {
    if (origin === '*') {
      throw new Error('CORS_ORIGINS must not contain a wildcard origin.');
    }

    let url: URL;

    try {
      url = new URL(origin);
    } catch {
      throw new Error(`CORS_ORIGINS contains an invalid origin: ${origin}`);
    }

    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
      throw new Error(
        `CORS_ORIGINS must contain exact HTTP(S) origins: ${origin}`,
      );
    }
  }

  if (new Set(origins).size !== origins.length) {
    throw new Error('CORS_ORIGINS must not contain duplicate origins.');
  }

  return origins;
}

function parseCredentials(value: string | undefined): boolean {
  if (value !== 'true' && value !== 'false') {
    throw new Error('CORS_CREDENTIALS must be either true or false.');
  }

  return value === 'true';
}

export function createCorsOptions(
  environment: NodeJS.ProcessEnv = process.env,
): CorsOptions {
  const origins = parseOrigins(environment.CORS_ORIGINS);
  const credentials = parseCredentials(environment.CORS_CREDENTIALS);

  return {
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) {
        callback(null, false);
        return;
      }

      callback(null, origins.includes(requestOrigin));
    },
    credentials,
    methods: allowedMethods,
    allowedHeaders,
  };
}
