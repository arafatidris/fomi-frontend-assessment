import { MODELS } from '@/data/create/models';

/** GET /api/models (static, prerendered at build time) */
export function GET() {
  return Response.json({ models: MODELS });
}
