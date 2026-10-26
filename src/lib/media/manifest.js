import 'server-only';
import manifest from '@/data/media-manifest.json';

/**
 * Resolves a media key ("create/g01-1") to what the UI needs to render it:
 * src, intrinsic size and a blur placeholder (plus poster/duration for video).
 * Server-only so the ~45KB manifest never ships to the browser; components
 * receive already-resolved media objects instead.
 */
export function getMedia(key) {
  const entry = manifest[key];
  if (!entry) throw new Error(`Unknown media "${key}". Run \`npm run media:build\`.`);
  return entry;
}
