import { readRoundJob } from '@/lib/mock/studio-engine';

/** GET /api/studio/rounds/:id → { job } with status queued | running | succeeded */
export async function GET(request, { params }) {
  const { id } = await params;
  const job = readRoundJob(id, Date.now());
  if (!job) return Response.json({ error: { code: 'not_found', message: 'No round job with that id.' } }, { status: 404 });
  return Response.json({ job }, { headers: { 'Cache-Control': 'no-store' } });
}
