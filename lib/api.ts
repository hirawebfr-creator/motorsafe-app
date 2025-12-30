export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: string };

export function success<T>(data: T): ApiSuccess<T> {
  return { ok: true, data };
}

export function failure(message: string, status = 500) {
  return { ok: false, error: message, status } as ApiError & { status: number };
}
