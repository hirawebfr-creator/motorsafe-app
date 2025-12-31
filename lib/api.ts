export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: string; details?: unknown };

export function success<T>(data: T): ApiSuccess<T> {
  return { ok: true, data };
}

export function failure(message: string, details?: unknown): ApiError {
  return { ok: false, error: message, details };
}
