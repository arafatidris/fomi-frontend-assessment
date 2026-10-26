import { createRoundJob } from '@/lib/mock/studio-engine';
import { handleJson } from '@/lib/mock/http';

/** POST /api/studio/rounds → 202 { job }. Body: { shotId, kind, axis?, variants?, direction, instruction?, changes?, count, roundNumber } */
export function POST(request) {
  return handleJson(request, (body, now) => ({ job: createRoundJob(body, now) }), { status: 202, delay: 120 });
}
