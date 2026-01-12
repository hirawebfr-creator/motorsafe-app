type FetcherOptions = RequestInit & {
  noStore?: boolean;
};

export async function fetcher<T>(input: RequestInfo | URL, init: FetcherOptions = {}) {
  const { noStore, ...rest } = init;
  const res = await fetch(input, {
    ...rest,
    cache: noStore ? "no-store" : rest.cache,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    const message =
      typeof json?.error === "string"
        ? json.error
        : json?.error?.message || "Erreur serveur.";
    const error = new Error(message);
    const details =
      typeof json?.error === "object" && json?.error
        ? json.error.details
        : json?.details;
    (error as { details?: unknown }).details = details;
    throw error;
  }

  return json.data as T;
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  options: { method?: string; body?: unknown; noStore?: boolean; headers?: HeadersInit } = {}
) {
  const { method = "POST", body, noStore, headers } = options;
  return fetcher<T>(input, {
    method,
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    noStore,
  });
}
