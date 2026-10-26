import 'server-only';

/**
 * Shared JSON handling for the mock API routes: parse the body, run the
 * handler, map validation errors (anything with a `field`) to 422.
 */
export async function handleJson(request, run, { status = 200, delay = 0 } = {}) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: 'invalid_json', message: 'Request body must be JSON.' } }, { status: 400 });
  }
  try {
    const result = run(body, Date.now());
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    return Response.json(result, { status });
  } catch (error) {
    if (error.field) {
      return Response.json({ error: { code: 'invalid_request', field: error.field, message: error.message } }, { status: 422 });
    }
    throw error;
  }
}
