export class ApiError extends Error {
  constructor(message, { status, code, field } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

/** fetch + JSON with consistent errors. Aborts surface as AbortError for callers to ignore. */
export async function request(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('You appear to be offline. Check your connection and try again.', { code: 'network' });
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error?.message ?? 'Something went wrong. Please try again.', {
      status: response.status,
      code: data.error?.code,
      field: data.error?.field,
    });
  }
  return data;
}

export const isAbort = (error) => error?.name === 'AbortError';
