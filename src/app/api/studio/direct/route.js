import { interpretDirection } from '@/lib/mock/studio-engine';
import { handleJson } from '@/lib/mock/http';

/** POST /api/studio/direct → { proposal: { instruction, changes[], skipped[] } }. Body: { instruction, direction, locks } */
export function POST(request) {
  return handleJson(request, (body) => ({ proposal: interpretDirection(body) }), { delay: 650 });
}
