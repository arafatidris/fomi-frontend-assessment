import 'server-only';
import { STUDIO_PROJECT } from '@/data/studio/project';
import { FIELD_KEYS, getFieldLabel, resolveTakeDirection } from '@/data/studio/direction';
import { getMedia } from '@/lib/media/manifest';
import { hashString } from '@/lib/utils/hash';

/**
 * Mock backend for Fomi Studio. Rounds render through the same stateless
 * create-then-poll contract as the Create API; the "AI" endpoints (axis
 * suggestions, direction rewrites) are small deterministic rule sets.
 */

const KINDS = new Set(['generate', 'explore', 'direct']);

/** Carries the offending field so the HTTP layer can answer 422. */
export class StudioValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.field = field;
  }
}

const media = (key) => {
  const entry = getMedia(key);
  return { src: entry.src, width: entry.width, height: entry.height, blurDataURL: entry.blurDataURL };
};

const findShot = (id) => STUDIO_PROJECT.shots.find((shot) => shot.id === id);

/* ------------------------------------------------------------- project -- */

/** The project as the client needs it: every take resolved to media + its full direction. */
export function getStudioProject() {
  const { shots, ...meta } = STUDIO_PROJECT;
  return {
    ...meta,
    shots: shots.map(({ pools, rounds, ...shot }) => ({
      ...shot,
      rounds: rounds.map(({ takes, ...round }) => ({
        ...round,
        takes: takes.map((take, index) => ({
          id: take.id,
          label: `${round.number}.${index + 1}`,
          seed: take.seed,
          rating: take.rating,
          variant: take.variant ?? null,
          direction: resolveTakeDirection(round, take),
          media: media(`studio/${take.id}`),
        })),
      })),
    })),
  };
}

/* --------------------------------------------------------- suggestions -- */

const GENERIC_VARIANTS = {
  subject: [
    'a lone hiker pausing to look back over their shoulder',
    'two hikers walking side by side, small in the frame',
    'a hiker sitting on a boulder, thermos in hand',
    'a figure mid-stride, hood up against the wind',
  ],
  setting: [
    'on a windswept ridge above the clouds',
    'beside a black-sand beach under sea stacks',
    'in a birch forest after the first snow',
    'on a frozen lake at the edge of a fjord',
  ],
  light: [
    'first light, low warm gold raking across the water',
    'blue hour before sunrise, cold and shadowless',
    'flat overcast with low cloud on the peaks',
    'night, cold moonlight and the first stars',
  ],
  camera: [
    'wide 16mm establishing shot, the whole valley in frame',
    '35mm, figure on the right third, open sky on the left for copy',
    '85mm, close on the figure',
    'low and wide from the ground, horizon very low',
  ],
  palette: ['glacier teal and slate', 'ember orange against muted earth', 'monochrome silver', 'faded film, warm highlights'],
  mood: ['airy and hopeful', 'brooding, a storm coming in', 'nostalgic, like a film still', 'serene, minimal, almost silent'],
};

/** Four alternative values for an axis, excluding the current one. */
export function suggestVariants({ shotId, axis, direction }) {
  if (!FIELD_KEYS.includes(axis)) throw new StudioValidationError('axis', 'Unknown direction field.');
  const pool = findShot(shotId)?.pools.find((entry) => entry.kind === 'explore' && entry.axis === axis);
  const candidates = pool ? pool.takes.map((take) => take.variant) : GENERIC_VARIANTS[axis];
  const current = direction?.[axis];
  const variants = candidates.filter((value) => value !== current);
  const extras = GENERIC_VARIANTS[axis].filter((value) => value !== current && !variants.includes(value));
  return [...variants, ...extras].slice(0, 4);
}

/* ------------------------------------------------------- interpreter --- */

const RULES = [
  { pattern: /\b(cold|colder|cool|cooler|icy|frost|winter)\b/, set: { light: 'cold, clear early light', palette: 'glacier blue and slate with a single warm accent' } },
  { pattern: /\b(warm|warmer|golden|sunset|sunrise|cozy)\b/, set: { light: 'first light, low warm gold raking across the water', palette: 'amber and ember with deep shadows' } },
  { pattern: /\b(mist|misty|fog|foggy|haze|hazy)\b/, set: { light: 'first light diffused through low morning mist' } },
  { pattern: /\b(moody|moodier|dark|darker|dramatic|storm|stormy)\b/, set: { mood: 'brooding, a storm coming in', light: 'low, heavy light under storm clouds' } },
  { pattern: /\b(still|stillness|calm|calmer|quiet|quieter|serene)\b/, set: { mood: 'hushed, cold, completely still' } },
  { pattern: /\b(bright|brighter|airy|hopeful|happier|uplifting)\b/, set: { mood: 'airy and hopeful', light: 'bright, clean daylight' } },
  { pattern: /\b(close|closer|tight|tighter|detail|intimate)\b/, set: { camera: '85mm, close on the figure' } },
  { pattern: /\b(wide|wider|vast|epic|establishing)\b/, set: { camera: 'wide 16mm establishing shot, the whole valley in frame' } },
  { pattern: /\b(night|stars|starry|moon|moonlit)\b/, set: { light: 'night, cold moonlight and the first stars' } },
  { pattern: /\b(film|vintage|nostalgic|retro|analog)\b/, set: { palette: 'faded film, warm highlights', mood: 'nostalgic, like a film still' } },
  { pattern: /\b(minimal|simpler|simple|clean|cleaner)\b/, set: { mood: 'serene, minimal, almost silent' } },
  { pattern: /\b(orange|ember|accent|pop)\b/, set: { palette: 'ember orange against muted earth' } },
  { pattern: /\b(mono|monochrome|black and white|grayscale|greyscale)\b/, set: { palette: 'monochrome silver' } },
];

/**
 * Turns a plain-language direction into field-level changes. Locked fields
 * are never touched; they are reported back so the UI can say why.
 */
export function interpretDirection({ instruction, direction, locks = {} }) {
  const text = String(instruction ?? '').trim();
  if (text.length < 3) throw new StudioValidationError('instruction', 'Tell Fomi what to change, e.g. “colder, more mist”.');
  if (!direction || FIELD_KEYS.some((key) => typeof direction[key] !== 'string')) {
    throw new StudioValidationError('direction', 'A complete direction is required.');
  }

  const lower = text.toLowerCase();
  const proposed = {};
  for (const rule of RULES) {
    if (rule.pattern.test(lower)) Object.assign(proposed, rule.set);
  }

  if (!Object.keys(proposed).length) {
    // Nothing recognised: fold the note into the first unlocked descriptive field.
    const target = ['mood', 'setting', 'subject'].find((key) => !locks[key]);
    if (target) proposed[target] = `${direction[target]}, ${text.replace(/[.!]+$/, '').toLowerCase()}`;
  }

  const changes = [];
  const skipped = [];
  for (const [field, to] of Object.entries(proposed)) {
    if (locks[field]) skipped.push({ field, label: getFieldLabel(field), reason: 'locked' });
    else if (direction[field] !== to) changes.push({ field, from: direction[field], to });
  }
  changes.sort((a, b) => FIELD_KEYS.indexOf(a.field) - FIELD_KEYS.indexOf(b.field));
  return { instruction: text, changes, skipped };
}

/* ------------------------------------------------------------- rounds --- */

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const decode = (token) => JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));

function validDirection(direction) {
  return direction && FIELD_KEYS.every((key) => typeof direction[key] === 'string' && direction[key].length <= 400);
}

export function createRoundJob(input, now) {
  const shot = findShot(input.shotId);
  if (!shot) throw new StudioValidationError('shotId', 'Unknown shot.');
  if (!KINDS.has(input.kind)) throw new StudioValidationError('kind', 'Unknown round type.');
  if (!validDirection(input.direction)) throw new StudioValidationError('direction', 'A complete direction is required.');
  if (input.kind === 'explore' && !FIELD_KEYS.includes(input.axis)) throw new StudioValidationError('axis', 'Pick a field to explore.');

  const count = Math.min(4, Math.max(1, Number(input.count) || 4));
  const variants =
    input.kind === 'explore' ? (Array.isArray(input.variants) ? input.variants : []).slice(0, count).map(String) : [];
  if (input.kind === 'explore' && variants.length < 2) throw new StudioValidationError('variants', 'An exploration needs at least two values.');

  const job = {
    v: 1,
    t: now,
    shotId: shot.id,
    kind: input.kind,
    axis: input.kind === 'explore' ? input.axis : null,
    variants,
    direction: input.direction,
    instruction: input.kind === 'direct' ? String(input.instruction ?? '').slice(0, 300) : null,
    changes: Array.isArray(input.changes) ? input.changes.slice(0, FIELD_KEYS.length) : [],
    round: Math.max(1, Number(input.roundNumber) || 1),
    count: input.kind === 'explore' ? variants.length : count,
    basedOnTakeId: typeof input.basedOnTakeId === 'string' ? input.basedOnTakeId : null,
    ms: 2400 + count * 380,
  };
  return { id: encode(job), status: 'queued', progress: 0, etaMs: job.ms };
}

/** Pool to draw renders from: the explored axis, then re-rolls, then the shot's own takes. */
function poolFor(shot, job) {
  const explore = job.kind === 'explore' && shot.pools.find((pool) => pool.kind === 'explore' && pool.axis === job.axis);
  const generate = shot.pools.find((pool) => pool.kind === 'generate');
  const chosen = explore || generate;
  if (chosen) return chosen.takes.map((take, index) => ({ key: `studio/${chosen.id}-${index + 1}`, seed: take.seed ?? chosen.seed }));
  return shot.rounds.flatMap((round) => round.takes).map((take) => ({ key: `studio/${take.id}`, seed: take.seed + 1000 }));
}

function buildRound(job, id) {
  const shot = findShot(job.shotId);
  const pool = poolFor(shot, job);
  const key = hashString(id).toString(36);
  const offset = job.kind === 'explore' ? 0 : job.round % pool.length;

  const takes = Array.from({ length: job.count }, (_, index) => {
    const source = pool[(offset + index) % pool.length];
    const variant = job.kind === 'explore' ? job.variants[index] : null;
    return {
      id: `${shot.id}-${key}-${index + 1}`,
      label: `${job.round}.${index + 1}`,
      seed: source.seed,
      rating: null,
      variant,
      direction: variant ? { ...job.direction, [job.axis]: variant } : job.direction,
      media: media(source.key),
    };
  });

  return {
    id: `${shot.id}-${key}`,
    number: job.round,
    kind: job.kind,
    axis: job.axis,
    instruction: job.instruction,
    base: job.direction,
    changes: job.changes,
    basedOnTakeId: job.basedOnTakeId,
    createdAt: job.t + job.ms,
    takes,
  };
}

export function readRoundJob(id, now) {
  let job;
  try {
    job = decode(id);
  } catch {
    return null;
  }
  if (job?.v !== 1 || !findShot(job.shotId)) return null;

  const elapsed = now - job.t;
  if (elapsed < 400) return { id, status: 'queued', progress: 0, etaMs: job.ms - elapsed };
  if (elapsed < job.ms) {
    const progress = Math.min(0.97, 1 - (1 - elapsed / job.ms) ** 1.5);
    return { id, status: 'running', progress, etaMs: job.ms - elapsed };
  }
  return { id, status: 'succeeded', progress: 1, round: buildRound(job, id) };
}
