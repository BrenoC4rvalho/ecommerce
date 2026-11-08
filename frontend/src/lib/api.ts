export type NestApiError = {
  statusCode: number;
  error: string;
  message: string | string[];
  details?: unknown;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: NestApiError | undefined,
  ) {
    super(
      Array.isArray(payload?.message)
        ? payload.message.join(', ')
        : (payload?.message ?? `HTTP ${status}`),
    );
    this.name = 'ApiError';
  }
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

function isNestApiError(value: unknown): value is NestApiError {
  return typeof value === 'object' && value !== null && 'message' in value && 'statusCode' in value;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.headers.get('content-length') === '0') return undefined;

  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers, ...requestOptions } = options;
  const response = await fetch(path, {
    ...requestOptions,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
  });
  const payload = await parseBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, isNestApiError(payload) ? payload : undefined);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
