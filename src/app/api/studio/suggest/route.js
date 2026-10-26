import { suggestVariants } from '@/lib/mock/studio-engine';
import { handleJson } from '@/lib/mock/http';

/** POST /api/studio/suggest → { variants: string[] }. Body: { shotId, axis, direction } */
export function POST(request) {
  return handleJson(request, (body) => ({ variants: suggestVariants(body) }), { delay: 380 });
}
