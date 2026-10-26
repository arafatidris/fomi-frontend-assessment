/**
 * Builds every demo asset in /public/media and the manifest the app reads
 * dimensions and blur placeholders from (src/data/media-manifest.json).
 *
 * Sources are declared next to the data that uses them:
 *   { picsum: 980 }   Unsplash-licensed photo via picsum.photos
 *   { file: 'x' }     committed original in scripts/sources
 * plus optional framing (`focus`, `zoom`, `flip`), color `grade` steps and,
 * for video, a camera `motion`.
 *
 *   npm run media:build            # build what is missing
 *   npm run media:build -- --force # rebuild everything
 */
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';

import { SEED_GENERATIONS, RESULT_POOLS } from '../src/data/create/generations.js';
import { STYLE_PRESETS } from '../src/data/create/styles.js';
import { STUDIO_PROJECT } from '../src/data/studio/project.js';
import { getAspectRatio } from '../src/lib/media/aspect-ratios.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'media');
const CACHE = path.join(ROOT, '.cache', 'media-sources');
const SOURCES = path.join(ROOT, 'scripts', 'sources');
const MANIFEST = path.join(ROOT, 'src', 'data', 'media-manifest.json');
const FORCE = process.argv.includes('--force');

/* ----------------------------------------------------------------- jobs -- */

function collectJobs() {
  const jobs = [];
  const add = (key, source, aspectRatio, longEdge, extra = {}) => jobs.push({ key, source, aspectRatio, longEdge, ...extra });

  for (const generation of SEED_GENERATIONS) {
    generation.outputs.forEach((output, index) => {
      const key = `create/${generation.id}-${index + 1}`;
      if (generation.type === 'video') {
        add(key, output.source, generation.aspectRatio, 1280, { video: { duration: output.duration } });
      } else {
        add(key, output.source, generation.aspectRatio, 1280);
      }
    });
  }

  for (const pool of RESULT_POOLS) {
    pool.sources.forEach((source, index) => add(`create/${pool.id}-${index + 1}`, source, '1:1', 1280, { native: true }));
  }

  for (const style of STYLE_PRESETS) {
    if (style.source) add(style.thumb, style.source, '1:1', 512);
  }

  for (const shot of STUDIO_PROJECT.shots) {
    for (const round of shot.rounds) {
      for (const take of round.takes) add(`studio/${take.id}`, take.source, shot.aspectRatio, 1600);
    }
    for (const pool of shot.pools) {
      pool.takes.forEach((take, index) => add(`studio/${pool.id}-${index + 1}`, take.source, shot.aspectRatio, 1600));
    }
  }

  return jobs;
}

/* -------------------------------------------------------------- sources -- */

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function download(url, file) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url, { redirect: 'follow' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await writeFile(file, Buffer.from(await response.arrayBuffer()));
      return;
    } catch (error) {
      if (attempt === 4) throw new Error(`${url}: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
}

const pending = new Map();
// Largest source long edge any job needs per photo, so tight crops stay sharp
// without downloading every original at full size.
const requiredLongEdge = new Map();

function planDownloads(jobs) {
  for (const job of jobs) {
    if (!job.source.picsum) continue;
    const needed = Math.min(5000, job.longEdge * (job.source.zoom ?? 1) * 2);
    requiredLongEdge.set(job.source.picsum, Math.max(requiredLongEdge.get(job.source.picsum) ?? 0, needed));
  }
}

/** Resolves a source declaration to a local file, downloading it once. */
function loadSource(source) {
  const id = source.file ? `file:${source.file}` : `picsum:${source.picsum}`;
  if (!pending.has(id)) pending.set(id, fetchSource(source));
  return pending.get(id);
}

async function fetchSource(source) {
  if (source.file) return path.join(SOURCES, source.file);
  await mkdir(CACHE, { recursive: true });

  const longEdge = Math.round(requiredLongEdge.get(source.picsum) ?? 2560);
  const file = path.join(CACHE, `picsum-${source.picsum}-${longEdge}.jpg`);
  if (!(await exists(file))) {
    const info = await (await fetch(`https://picsum.photos/id/${source.picsum}/info`)).json();
    const scale = Math.min(1, longEdge / Math.max(info.width, info.height));
    const width = Math.round(info.width * scale);
    const height = Math.round(info.height * scale);
    await download(`https://picsum.photos/id/${source.picsum}/${width}/${height}.jpg`, file);
  }
  return file;
}

/* -------------------------------------------------------------- framing -- */

/** Crop rectangle for an aspect ratio, zoomed in around a focus point. */
function cropRect(width, height, aspect, { zoom = 1, focus = [0.5, 0.5] } = {}) {
  let cropWidth = width;
  let cropHeight = width / aspect;
  if (cropHeight > height) {
    cropHeight = height;
    cropWidth = height * aspect;
  }
  // Round the size first so clamping can never push the crop past an edge.
  cropWidth = Math.min(width, Math.round(cropWidth / zoom));
  cropHeight = Math.min(height, Math.round(cropHeight / zoom));
  const left = Math.min(Math.max(Math.round(focus[0] * width - cropWidth / 2), 0), width - cropWidth);
  const top = Math.min(Math.max(Math.round(focus[1] * height - cropHeight / 2), 0), height - cropHeight);
  return { left, top, width: cropWidth, height: cropHeight };
}

function outputSize(aspect, longEdge) {
  return aspect >= 1
    ? { width: longEdge, height: Math.round(longEdge / aspect) }
    : { width: Math.round(longEdge * aspect), height: longEdge };
}

/* --------------------------------------------------------------- grades -- */

const svg = (width, height, body) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`);

const stops = (list) =>
  list.map(([offset, color, opacity]) => `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`).join('');

const linearOverlay = (list, [x1, y1, x2, y2] = [0, 0, 0, 1]) => (width, height) =>
  svg(width, height, `<defs><linearGradient id="g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(list)}</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>`);

const radialOverlay = (list, [cx, cy, r] = [0.5, 0.5, 0.75]) => (width, height) =>
  svg(width, height, `<defs><radialGradient id="g" cx="${cx}" cy="${cy}" r="${r}">${stops(list)}</radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>`);

const vignette = (strength) => radialOverlay([[0.45, '#000', 0], [1, '#000', strength]], [0.5, 0.5, 0.78]);

const fog = (density) =>
  linearOverlay([
    [0, '#eef2f5', 0],
    [0.34, '#eef2f5', density * 0.35],
    [0.6, '#f4f6f8', density],
    [1, '#eef2f5', density * 0.55],
  ]);

/**
 * Each grade is a list of steps applied in order. Color steps map onto sharp
 * operations; overlays are SVG gradients composited with a blend mode.
 */
const GRADES = {
  golden: [
    { recomb: [[1.1, 0.07, 0], [0.03, 1, 0], [0, 0.02, 0.76]] },
    { modulate: { saturation: 1.08, brightness: 1.03 } },
    { overlay: radialOverlay([[0, '#ffc477', 0.7], [1, '#ffc477', 0]], [0.55, 0.4, 0.8]), blend: 'soft-light' },
    { overlay: radialOverlay([[0, '#ffd59a', 0.22], [1, '#ffd59a', 0]], [0.5, 0.38, 0.45]), blend: 'screen' },
  ],
  'blue-hour': [
    { recomb: [[0.8, 0.05, 0.08], [0.03, 0.9, 0.1], [0.04, 0.12, 1.14]] },
    { linear: [0.78, 2] },
    { modulate: { saturation: 0.86 } },
    { overlay: linearOverlay([[0, '#1a2a52', 0.55], [1, '#24365e', 0.2]]), blend: 'multiply' },
  ],
  overcast: [
    { modulate: { saturation: 0.52, brightness: 1.02 } },
    { linear: [0.8, 30] },
    { recomb: [[0.96, 0.02, 0.03], [0.01, 0.98, 0.03], [0.01, 0.04, 1.03]] },
    { overlay: linearOverlay([[0, '#ffffff', 0.4], [0.55, '#ffffff', 0]]), blend: 'screen' },
  ],
  dusk: [
    { recomb: [[1.06, 0.06, 0.06], [0, 0.93, 0.05], [0.07, 0, 1.03]] },
    { overlay: linearOverlay([[0, '#ff6f91', 0.55], [0.6, '#ff8a65', 0]]), blend: 'soft-light' },
    { overlay: linearOverlay([[0.5, '#3b2160', 0], [1, '#3b2160', 0.35]]), blend: 'multiply' },
  ],
  night: [
    { linear: [0.4, -2] },
    { recomb: [[0.68, 0.06, 0.12], [0.04, 0.8, 0.14], [0.06, 0.18, 1.16]] },
    { modulate: { saturation: 0.72 } },
    { overlay: radialOverlay([[0, '#c9d8ff', 0.18], [1, '#c9d8ff', 0]], [0.3, 0.18, 0.35]), blend: 'screen' },
    { overlay: vignette(0.6), blend: 'multiply' },
  ],
  mist: [
    { recomb: [[0.93, 0.03, 0.04], [0.02, 0.97, 0.04], [0.02, 0.06, 1.07]] },
    { modulate: { saturation: 0.7 } },
    { linear: [0.86, 20] },
    { overlay: fog(0.55), blend: 'screen' },
  ],
  'mist-heavy': [
    { recomb: [[0.92, 0.03, 0.05], [0.02, 0.96, 0.05], [0.02, 0.06, 1.08]] },
    { modulate: { saturation: 0.55 } },
    { linear: [0.78, 36] },
    { overlay: fog(0.8), blend: 'screen' },
  ],
  glacier: [
    { recomb: [[0.8, 0.13, 0.07], [0.04, 0.95, 0.09], [0.04, 0.15, 1.04]] },
    { modulate: { saturation: 0.88 } },
    { overlay: linearOverlay([[0, '#2b7787', 0.4], [1, '#1f4f63', 0.4]]), blend: 'soft-light' },
  ],
  ember: [
    { modulate: { saturation: 0.6 } },
    { linear: [1.06, -6] },
    { overlay: radialOverlay([[0, '#ff6a2b', 0.65], [1, '#ff6a2b', 0]], [0.82, 0.62, 0.55]), blend: 'soft-light' },
    { overlay: linearOverlay([[0, '#5a4636', 0.25], [1, '#2e2621', 0.3]]), blend: 'soft-light' },
  ],
  mono: [{ grayscale: true }, { linear: [1.1, -8] }, { tint: { r: 236, g: 230, b: 222 } }],
  film: [
    { linear: [0.84, 28] },
    { recomb: [[1.05, 0.05, 0], [0.02, 1, 0], [0, 0.05, 0.88]] },
    { modulate: { saturation: 0.8 } },
    { grain: 18 },
  ],
  airy: [
    { modulate: { brightness: 1.14, saturation: 0.84 } },
    { linear: [0.8, 42] },
    { overlay: radialOverlay([[0, '#ffffff', 0.35], [1, '#ffffff', 0]], [0.4, 0.2, 0.7]), blend: 'screen' },
  ],
  brooding: [
    { linear: [1.14, -30] },
    { modulate: { saturation: 0.66 } },
    { recomb: [[0.9, 0.04, 0.06], [0.02, 0.95, 0.06], [0.02, 0.08, 1.06]] },
    { overlay: linearOverlay([[0, '#0f1620', 0.55], [0.55, '#0f1620', 0]]), blend: 'multiply' },
    { overlay: vignette(0.55), blend: 'multiply' },
  ],
  nostalgic: [
    { overlay: linearOverlay([[0, '#ffb47a', 0.28], [1, '#7a4a2a', 0.22]]), blend: 'soft-light' },
    { overlay: vignette(0.35), blend: 'multiply' },
  ],
  serene: [
    { modulate: { saturation: 0.62, brightness: 1.06 } },
    { recomb: [[0.95, 0.02, 0.03], [0.01, 0.98, 0.03], [0.01, 0.03, 1.04]] },
  ],
};

async function applyGrade(buffer, names, width, height) {
  let current = buffer;
  for (const name of names) {
    const steps = GRADES[name];
    if (!steps) throw new Error(`Unknown grade "${name}"`);
    for (const step of steps) {
      let image = sharp(current);
      if (step.recomb) image = image.recomb(step.recomb);
      if (step.modulate) image = image.modulate(step.modulate);
      if (step.linear) image = image.linear(step.linear[0], step.linear[1]);
      if (step.grayscale) image = image.grayscale();
      if (step.tint) image = image.tint(step.tint);
      if (step.overlay) image = image.composite([{ input: step.overlay(width, height), blend: step.blend }]);
      if (step.grain) {
        const noise = await sharp({
          create: { width, height, channels: 3, noise: { type: 'gaussian', mean: 128, sigma: step.grain } },
        })
          .png()
          .toBuffer();
        image = image.composite([{ input: noise, blend: 'overlay' }]);
      }
      current = await image.removeAlpha().toFormat('png').toBuffer();
    }
  }
  return current;
}

/* -------------------------------------------------------------- render --- */

async function renderStill(job, file) {
  const sourceFile = await loadSource(job.source);
  const meta = await sharp(sourceFile).metadata();
  // Result pools keep their native aspect; everything else is framed to spec.
  const aspect = job.native ? meta.width / meta.height : getAspectRatio(job.aspectRatio).value;
  const size = outputSize(aspect, job.longEdge);
  const rect = cropRect(meta.width, meta.height, aspect, job.source);

  let image = sharp(sourceFile).rotate().extract(rect).resize(size.width, size.height, { fit: 'fill' });
  if (job.source.flip) image = image.flop();
  let buffer = await image.toColourspace('srgb').png().toBuffer();
  if (job.source.grade?.length) buffer = await applyGrade(buffer, job.source.grade, size.width, size.height);

  await sharp(buffer).webp({ quality: 82, effort: 5 }).toFile(file);
  return size;
}

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * Image-to-video stand-in: a slow camera move rendered frame by frame from a
 * high-res plate (sub-pixel smooth, unlike ffmpeg's zoompan) and piped to
 * ffmpeg as raw RGB.
 */
async function renderVideo(job, file) {
  const fps = 30;
  const frames = Math.round((job.video.duration ?? 5) * fps);
  const aspect = getAspectRatio(job.aspectRatio).value;
  const size = outputSize(aspect, job.longEdge);

  const sourceFile = await loadSource(job.source);
  const meta = await sharp(sourceFile).metadata();
  const base = cropRect(meta.width, meta.height, aspect, { focus: job.source.focus, zoom: 1.04 });
  const plate = await sharp(sourceFile).rotate().extract(base).resize(size.width * 2, size.height * 2).raw().toBuffer();

  const ffmpeg = spawn(ffmpegPath, [
    '-y', '-loglevel', 'error',
    '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${size.width}x${size.height}`, '-r', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an',
    file,
  ]);
  const finished = new Promise((resolve, reject) => {
    ffmpeg.on('error', reject);
    ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`))));
  });

  const plateWidth = size.width * 2;
  const plateHeight = size.height * 2;
  for (let frame = 0; frame < frames; frame++) {
    const t = ease(frame / (frames - 1));
    let zoom = 1;
    let panX = 0;
    if (job.source.motion === 'push-in') zoom = 1 + 0.12 * t;
    if (job.source.motion === 'pan-right') {
      zoom = 1.12;
      panX = -0.5 + t;
    }
    if (job.source.motion === 'pan-left') {
      zoom = 1.12;
      panX = 0.5 - t;
    }
    const width = plateWidth / zoom;
    const height = plateHeight / zoom;
    const slack = plateWidth - width;
    const left = Math.max(0, Math.min(slack, slack / 2 + panX * slack));
    const top = (plateHeight - height) / 2;
    const pixels = await sharp(plate, { raw: { width: plateWidth, height: plateHeight, channels: 3 } })
      .extract({ left: Math.round(left), top: Math.round(top), width: Math.round(width), height: Math.round(height) })
      .resize(size.width, size.height, { kernel: 'lanczos3' })
      .raw()
      .toBuffer();
    if (!ffmpeg.stdin.write(pixels)) await new Promise((resolve) => ffmpeg.stdin.once('drain', resolve));
  }
  ffmpeg.stdin.end();
  await finished;

  // Poster = first frame, so the still and the video line up exactly.
  const poster = file.replace(/\.mp4$/, '.webp');
  await sharp(plate, { raw: { width: plateWidth, height: plateHeight, channels: 3 } })
    .resize(size.width, size.height)
    .webp({ quality: 82 })
    .toFile(poster);
  return size;
}

async function blurDataURL(file) {
  const buffer = await sharp(file).resize(16, 16, { fit: 'inside' }).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${buffer.toString('base64')}`;
}

/* ----------------------------------------------------------------- main -- */

async function run() {
  const jobs = collectJobs();
  planDownloads(jobs);
  const previous = (await exists(MANIFEST)) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {};
  const manifest = {};
  const failures = [];
  let built = 0;

  const queue = [...jobs];
  async function worker() {
    while (queue.length) {
      const job = queue.shift();
      const extension = job.video ? 'mp4' : 'webp';
      const file = path.join(OUT, `${job.key}.${extension}`);
      const still = job.video ? file.replace(/\.mp4$/, '.webp') : file;
      await mkdir(path.dirname(file), { recursive: true });

      try {
        let size;
        if (!FORCE && (await exists(file)) && (await exists(still))) {
          if (previous[job.key]) {
            manifest[job.key] = previous[job.key];
            continue;
          }
          const meta = await sharp(still).metadata();
          size = { width: meta.width, height: meta.height };
        } else {
          size = job.video ? await renderVideo(job, file) : await renderStill(job, file);
          built++;
          console.log(`✓ ${job.key}.${extension}  ${size.width}×${size.height}`);
        }
        manifest[job.key] = {
          src: `/media/${job.key}.${extension}`,
          ...(job.video ? { poster: `/media/${job.key}.webp`, duration: job.video.duration } : {}),
          width: size.width,
          height: size.height,
          blurDataURL: await blurDataURL(still),
        };
      } catch (error) {
        failures.push(job.key);
        console.error(`✗ ${job.key}: ${error.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: 4 }, worker));

  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(MANIFEST, `${JSON.stringify(sorted, null, 1)}\n`);
  console.log(`Built ${built}, reused ${jobs.length - built - failures.length}, failed ${failures.length}. Manifest: ${path.relative(ROOT, MANIFEST)}`);
  if (failures.length) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
