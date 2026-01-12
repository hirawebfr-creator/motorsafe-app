export type ApiSuccess<T> = { ok: true; data: T };

export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

// NOTE: We keep `ok` for compatibility with the existing UI fetcher.
export type ApiError = { ok: false; error: ApiErrorPayload };

export function success<T>(data: T): ApiSuccess<T> {
  return { ok: true, data };
}

export function failure(
  message: string,
  details?: unknown,
  code: string = "UNKNOWN"
): ApiError {
  return { ok: false, error: { code, message, details } };
}
