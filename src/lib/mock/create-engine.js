import 'server-only';
import { SEED_GENERATIONS, RESULT_POOLS } from '@/data/create/generations';
import { DEFAULT_MODEL, getModel } from '@/data/create/models';
import { getStyle } from '@/data/create/styles';
import { ASPECT_RATIOS } from '@/lib/media/aspect-ratios';
import { getMedia } from '@/lib/media/manifest';
import { hashString } from '@/lib/utils/hash';

/**
 * A stateless mock of an async inference API.
 *
 * POST creates a job and returns its id; the id encodes the request and its
 * start time, so GET can derive status and progress on any serverless
 * instance without shared storage, the same create-then-poll contract real
 * providers expose.
 */

export const PROMPT_MAX = 1500;
const VIDEO_DURATIONS = [5, 10];

export class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.field = field;
  }
}

/* ------------------------------------------------------------ library --- */

function resolveOutput(key, extra = {}) {
  const media = getMedia(key);
  return {
    id: key.split('/')[1],
    src: media.src,
    width: media.width,
    height: media.height,
    blurDataURL: media.blurDataURL,
    ...(media.poster ? { poster: media.poster, duration: media.duration } : {}),
    ...extra,
  };
}

function toClientGeneration(seed) {
  return {
    id: seed.id,
    type: seed.type,
    prompt: seed.prompt,
    modelId: seed.modelId,
    aspectRatio: seed.aspectRatio,
    styleId: seed.styleId,
    ageMinutes: seed.minutesAgo,
    outputs: seed.outputs.map((output, index) =>
      resolveOutput(`create/${seed.id}-${index + 1}`, { seed: output.seed }),
    ),
  };
}

const LIBRARY = SEED_GENERATIONS.map(toClientGeneration);

/** Cursor-paginated feed of past generations, newest first. */
export function listGenerations({ type = 'all', cursor = 0, limit = 6 } = {}) {
  const items = type === 'all' ? LIBRARY : LIBRARY.filter((generation) => generation.type === type);
  const start = Math.max(0, Number(cursor) || 0);
  const page = items.slice(start, start + limit);
  const next = start + page.length;
  return { items: page, nextCursor: next < items.length ? String(next) : null, total: items.length };
}

/* --------------------------------------------------------------- jobs --- */

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const decode = (token) => JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));

function words(text) {
  return text.toLowerCase().match(/[a-z]+/g) ?? [];
}

function pickImagePool(prompt) {
  const tokens = new Set(words(prompt));
  const lower = prompt.toLowerCase();
  let best = RESULT_POOLS.find((pool) => pool.fallback);
  let bestScore = 0;
  for (const pool of RESULT_POOLS) {
    const score = pool.keywords.reduce(
      (total, keyword) => total + (keyword.includes(' ') ? lower.includes(keyword) : tokens.has(keyword)),
      0,
    );
    if (score > bestScore) {
      best = pool;
      bestScore = score;
    }
  }
  return best;
}

const VIDEO_KEYWORDS = {
  v01: ['jellyfish', 'ocean', 'underwater', 'sea', 'water', 'fish', 'wave'],
  v02: ['city', 'skyline', 'urban', 'aerial', 'drone', 'sunset', 'street'],
  v03: ['forest', 'fog', 'mist', 'cloud', 'clouds', 'trees', 'mountain', 'rain'],
  v04: ['aurora', 'northern', 'stars', 'sky', 'night', 'snow', 'space'],
};

function pickVideo(prompt) {
  const tokens = new Set(words(prompt));
  const ranked = Object.entries(VIDEO_KEYWORDS)
    .map(([id, keywords]) => [id, keywords.filter((keyword) => tokens.has(keyword)).length])
    .sort((a, b) => b[1] - a[1]);
  if (ranked[0][1] > 0) return ranked[0][0];
  const ids = Object.keys(VIDEO_KEYWORDS);
  return ids[hashString(prompt) % ids.length];
}

function durationFor({ type, count, modelId }) {
  if (type === 'video') return 6500;
  const speed = { 'fomi-draft': 0.5, 'fomi-realism': 1.35 }[modelId] ?? 1;
  return Math.round((1900 + 600 * count) * speed);
}

/** Validates a create request and returns a queued job. */
export function createJob(input, now) {
  const type = input.type === 'video' ? 'video' : 'image';
  const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
  if (prompt.length < 3) throw new ValidationError('prompt', 'Describe what you want to create (at least 3 characters).');
  if (prompt.length > PROMPT_MAX) throw new ValidationError('prompt', `Keep prompts under ${PROMPT_MAX} characters.`);

  const aspectRatio = ASPECT_RATIOS.some((ratio) => ratio.id === input.aspectRatio) ? input.aspectRatio : '1:1';
  const model = getModel(input.modelId);
  const modelId = model?.type === type ? model.id : DEFAULT_MODEL[type];
  const count = type === 'video' ? 1 : Math.min(4, Math.max(1, Number(input.count) || 4));
  const duration = VIDEO_DURATIONS.includes(Number(input.duration)) ? Number(input.duration) : 5;
  const styleId = getStyle(input.styleId)?.id ?? null;
  const seed = Number.isInteger(input.seed) ? input.seed : hashString(`${prompt}:${now}`) % 100000;

  const job = {
    v: 1,
    t: now,
    type,
    prompt,
    count,
    aspectRatio,
    modelId,
    styleId,
    seed,
    duration,
    ms: durationFor({ type, count, modelId }),
  };
  return { id: encode(job), status: 'queued', progress: 0, etaMs: job.ms };
}

function buildGeneration(job, id) {
  // Hash the whole token: its tail is shared by jobs with similar settings.
  const key = hashString(id).toString(36);
  if (job.type === 'video') {
    const videoId = pickVideo(job.prompt);
    return {
      id: `gen-${key}`,
      type: 'video',
      prompt: job.prompt,
      modelId: job.modelId,
      aspectRatio: job.aspectRatio,
      styleId: job.styleId,
      createdAt: job.t + job.ms,
      outputs: [resolveOutput(`create/${videoId}-1`, { id: `${key}-v`, seed: job.seed, duration: job.duration })],
    };
  }

  const pool = pickImagePool(job.prompt);
  const offset = hashString(job.prompt) % pool.sources.length;
  const outputs = Array.from({ length: job.count }, (_, index) => {
    const position = (offset + index) % pool.sources.length;
    return resolveOutput(`create/${pool.id}-${position + 1}`, {
      id: `${key}-${index + 1}`,
      seed: job.seed + index,
    });
  });

  return {
    id: `gen-${key}`,
    type: 'image',
    prompt: job.prompt,
    modelId: job.modelId,
    aspectRatio: job.aspectRatio,
    styleId: job.styleId,
    createdAt: job.t + job.ms,
    outputs,
  };
}

/** Derives a job's current state from its id and the current time. */
export function readJob(id, now) {
  let job;
  try {
    job = decode(id);
  } catch {
    return null;
  }
  if (job?.v !== 1 || typeof job.t !== 'number') return null;

  const elapsed = now - job.t;
  // A documented test hook: include "#fail" in a prompt to see error handling.
  if (job.prompt.includes('#fail') && elapsed > job.ms * 0.55) {
    return {
      id,
      status: 'failed',
      progress: 0.55,
      error: { code: 'render_failed', message: 'The model couldn’t finish this render. Try again or rephrase the prompt.' },
    };
  }
  if (elapsed < 450) return { id, status: 'queued', progress: 0, etaMs: job.ms - elapsed };
  if (elapsed < job.ms) {
    // Diffusion feels fast early and slow at the end; ease the reported progress the same way.
    const linear = elapsed / job.ms;
    const progress = Math.min(0.97, 1 - (1 - linear) ** 1.6);
    return { id, status: 'running', progress, etaMs: job.ms - elapsed };
  }
  return { id, status: 'succeeded', progress: 1, generation: buildGeneration(job, id) };
}
