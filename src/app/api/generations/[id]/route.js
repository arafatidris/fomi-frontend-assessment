import { readJob } from '@/lib/mock/create-engine';

/** GET /api/generations/:id  →  { job } with status queued | running | succeeded | failed */
export async function GET(request, { params }) {
  const { id } = await params;
  const job = readJob(id, Date.now());
  if (!job) {
    return Response.json({ error: { code: 'not_found', message: 'No generation job with that id.' } }, { status: 404 });
  }
  return Response.json({ job }, { headers: { 'Cache-Control': 'no-store' } });
}
