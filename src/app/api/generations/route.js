import { createJob, listGenerations, ValidationError } from '@/lib/mock/create-engine';

const TYPES = new Set(['all', 'image', 'video']);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** GET /api/generations?type=all|image|video&cursor=0&limit=6 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = TYPES.has(searchParams.get('type')) ? searchParams.get('type') : 'all';
  const limit = Math.min(24, Math.max(1, Number(searchParams.get('limit')) || 6));

  // Simulated network latency so loading states are real, not theoretical.
  await delay(320);
  return Response.json(listGenerations({ type, cursor: searchParams.get('cursor'), limit }));
}

/** POST /api/generations  →  202 { job } */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: 'invalid_json', message: 'Request body must be JSON.' } }, { status: 400 });
  }

  try {
    const job = createJob(body, Date.now());
    await delay(140);
    return Response.json({ job }, { status: 202 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: { code: 'invalid_request', field: error.field, message: error.message } }, { status: 422 });
    }
    throw error;
  }
}
