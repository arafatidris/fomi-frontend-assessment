/**
 * Builds the submission PDF (cover with live links, review guide, Part A and
 * Part B summaries, and the full Product Thinking document) and keeps the
 * live links in README.md and docs/PRODUCT_THINKING.md in sync.
 *
 *   npm run submission -- --live=https://your-app.vercel.app
 *   npm run submission -- --live=… --name="Your Name" --out=../Submission.pdf
 *
 * Renders with the locally installed Google Chrome (playwright-core).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LINKS = path.join(ROOT, 'docs', 'links.json');
const DOCS_WITH_LINKS = ['README.md', path.join('docs', 'PRODUCT_THINKING.md')];

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || 'true'];
  }),
);

const previous = JSON.parse(await readFile(LINKS, 'utf8').catch(() => '{}'));
const live = (args.live ?? previous.live ?? 'LIVE_URL').replace(/\/$/, '');
const repo = args.repo ?? previous.repo ?? 'https://github.com/arafatidris/fomi-frontend-assessment';
const name = args.name ?? previous.name ?? '@arafatidris';
const out = path.resolve(ROOT, args.out ?? previous.out ?? '../Fomi-Frontend-Assessment-Submission.pdf');

/* ------------------------------------------------- keep docs in sync --- */

for (const file of DOCS_WITH_LINKS) {
  const full = path.join(ROOT, file);
  let text = await readFile(full, 'utf8');
  for (const old of new Set(['LIVE_URL', previous.live].filter(Boolean))) text = text.split(old).join(live);
  await writeFile(full, text);
}
await writeFile(LINKS, `${JSON.stringify({ live, repo, name, out: path.relative(ROOT, out) }, null, 2)}\n`);

/* -------------------------------------------------------------- html --- */

const image = async (file) =>
  `data:image/jpeg;base64,${(await readFile(path.join(ROOT, 'docs', 'screenshots', file))).toString('base64')}`;

const thinking = marked.parse(await readFile(path.join(ROOT, 'docs', 'PRODUCT_THINKING.md'), 'utf8'));
const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const link = (href, label = href.replace(/^https?:\/\//, '')) => `<a href="${href}">${label}</a>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 18mm 16mm 18mm; }
  @page :first { margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #1c1917; font-size: 10.5pt; line-height: 1.55; }
  a { color: #b4472f; text-decoration: none; }
  h1, h2, h3 { line-height: 1.2; letter-spacing: -0.01em; }
  h2 { font-size: 17pt; margin: 0 0 10px; }
  h3 { font-size: 11.5pt; margin: 18px 0 6px; }
  p { margin: 0 0 8px; }
  ul, ol { margin: 0 0 10px; padding-left: 18px; }
  li { margin: 2px 0; }
  code, kbd { font-family: 'IBM Plex Mono', monospace; font-size: 9pt; background: #f3ebe6; padding: 1px 4px; border-radius: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 9.5pt; }
  th, td { text-align: left; vertical-align: top; padding: 6px 8px; border-bottom: 1px solid #ece3dd; }
  th { font-weight: 600; background: #faf3ef; }
  blockquote { margin: 10px 0 14px; padding: 10px 14px; border-left: 3px solid #e8917b; background: #fbf4f0; border-radius: 0 8px 8px 0; }
  hr { border: 0; border-top: 1px solid #ece3dd; margin: 16px 0; }
  .page { page-break-after: always; }
  .eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 8.5pt; letter-spacing: 0.12em; text-transform: uppercase; color: #b4472f; margin-bottom: 6px; }
  .cover { height: 297mm; padding: 22mm 20mm 18mm; background: linear-gradient(160deg, #faf7f4 0%, #f6eae4 60%, #efd6ca 100%); display: flex; flex-direction: column; }
  .brand { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 15pt; }
  .mark { width: 34px; height: 34px; border-radius: 10px; background: #1c1917; color: #fff; display: grid; place-items: center; font-weight: 800; font-size: 19pt; }
  .cover h1 { font-size: 30pt; margin: 34px 0 10px; letter-spacing: -0.03em; }
  .cover .lede { font-size: 12.5pt; color: #57504b; max-width: 150mm; }
  .meta { margin-top: 14px; font-size: 10pt; color: #57504b; }
  .links { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 22px 0 20px; }
  .card { background: #fff; border: 1px solid #ece3dd; border-radius: 14px; padding: 12px 14px; }
  .card b { display: block; font-size: 9pt; color: #57504b; font-weight: 600; margin-bottom: 4px; }
  .card a { font-weight: 600; font-size: 9.5pt; word-break: break-all; }
  .shot { width: 100%; border-radius: 12px; border: 1px solid #e7dcd5; box-shadow: 0 12px 30px -16px rgba(60,35,25,.45); }
  .cover .shot { margin-top: auto; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .grid2 .shot { box-shadow: none; }
  .caption { font-size: 8.5pt; color: #786f69; margin-top: 4px; }
  .steps li { margin: 4px 0; }
  .score { font-weight: 700; color: #2b8a5e; }
  .thinking { font-size: 10pt; line-height: 1.5; }
  .thinking h1 { font-size: 20pt; margin: 0 0 8px; }
  .thinking h2 { font-size: 13.5pt; margin: 16px 0 6px; padding-top: 2px; page-break-after: avoid; }
  .thinking table { page-break-inside: avoid; }
</style></head><body>

<section class="cover page">
  <div class="brand"><span class="mark">F</span>Fomi</div>
  <h1>Frontend Developer<br>Technical Assessment</h1>
  <p class="lede"><b>Part A:</b> the Create workspace, built from the design.<br><b>Part B:</b> Fomi Studio, a redesigned Image Generation Workspace for professionals.</p>
  <p class="meta">Submitted by <b>${name}</b> · ${date} · Next.js 16, React 19, JavaScript, Tailwind CSS v4 · Deployed on Vercel</p>
  <div class="links">
    <div class="card"><b>Part A · Live</b>${link(live)}</div>
    <div class="card"><b>Part B · Live</b>${link(`${live}/studio`)}</div>
    <div class="card"><b>Source code</b>${link(repo)}</div>
  </div>
  <img class="shot" src="${await image('create-desktop.jpg')}" alt="">
</section>

<section class="page">
  <div class="eyebrow">Review guide</div>
  <h2>See it in three minutes</h2>
  <div class="grid2">
    <div>
      <h3>Create · ${link(live, 'open')}</h3>
      <ol class="steps">
        <li>Type a prompt (try “a golden retriever puppy in autumn leaves”) and press <b>Generate</b> or <kbd>⌘ ↵</kbd>. A pending card appears instantly and the results develop into focus.</li>
        <li>Click an image for the viewer: arrow keys, save with <kbd>F</kbd>, a mock 2× upscale, and “reuse prompt &amp; settings”.</li>
        <li>Try the tabs: <b>Video</b> (hover to play), <b>Edit</b> (describe a change, then drag the before/after slider) and <b>Assets</b>.</li>
        <li>Switch to dark mode, open <b>Gallery</b>, press <kbd>?</kbd> for shortcuts, and resize to mobile.</li>
      </ol>
    </div>
    <div>
      <h3>Studio · ${link(`${live}/studio`, 'open')}</h3>
      <ol class="steps">
        <li>You’re returning to a live campaign. The shot list shows what’s final and what needs review.</li>
        <li>Click the compass beside <b>Palette</b>, then <b>Render sweep</b>: four takes where only the palette changes, with the same seed.</li>
        <li>Type “warmer and more dramatic, closer” in <b>Direct a change</b>. You get a reviewable diff, and the locked Camera field is left alone.</li>
        <li>Review by keyboard: arrows, <kbd>P</kbd> pick, <kbd>X</kbd> reject, <kbd>F</kbd> final, <kbd>C</kbd> compare, <kbd>⌘ K</kbd> commands.</li>
      </ol>
    </div>
  </div>

  <h3>Part A: built from the design, finished as a product</h3>
  <ul>
    <li><b>Faithful structure:</b> sliding coral tab indicator, floating History card the feed scrolls beneath, peach composer with the dark-bordered prompt box, option pills, Advanced and Styles sections, and prompt cards beside 4-up results.</li>
    <li><b>Real interactions:</b> optimistic generation with progress and queueing, accessible pickers, a full-screen viewer, searchable history grouped by day, community gallery, favorites, delete with undo, and an Edit tool with before/after.</li>
    <li><b>Every state designed:</b> skeletons, queued and rendering progress, failure with retry (add <code>#fail</code> to a prompt), infinite-scroll loading and errors, and empty states with starter prompts.</li>
    <li><b>Responsive by intent:</b> a sidebar composer on desktop; on tablet and mobile the prompt docks within thumb reach and its settings open in a bottom sheet.</li>
    <li><b>Mock API:</b> create-then-poll jobs (<code>202</code>, then <code>queued → running → succeeded | failed</code>), cursor pagination and <code>422</code> validation. It’s stateless, so it works on serverless.</li>
    <li><b>Deliberate tweaks:</b> the Generate coral is deepened to <code>#C0533B</code> so white text passes WCAG AA, the copy typos are fixed, and the credit cost is shown before you click.</li>
  </ul>

  <h3>Measured quality (Lighthouse 12, live deployment)</h3>
  <table>
    <tr><th>Page</th><th>Performance (mobile / desktop)</th><th>Accessibility</th><th>Best practices</th><th>SEO</th><th>CLS</th></tr>
    <tr><td>Create</td><td class="score">91–96 / 100</td><td class="score">100</td><td class="score">100</td><td class="score">100</td><td>0</td></tr>
    <tr><td>Studio</td><td class="score">86–96 / 100</td><td class="score">100</td><td class="score">100</td><td class="score">100</td><td>0</td></tr>
  </table>
  <p class="caption">Mobile uses Lighthouse’s simulated slow 4G and 4× CPU slowdown; scores vary between runs, so ranges are shown.</p>
</section>

<section class="page">
  <div class="eyebrow">Part B</div>
  <h2>Fomi Studio: direct, don’t re-roll</h2>
  <p>As generation gets cheap, the bottleneck becomes <b>direction</b> and <b>selection</b>. Studio organises work by the campaign’s shot list, turns the prompt into six lockable dimensions you can explore one at a time, shows every AI change as a diff you approve, and makes culling as fast as in Lightroom.</p>
  <div class="grid2">
    <div><img class="shot" src="${await image('studio-sweep.jpg')}" alt=""><p class="caption">An axis sweep: only the palette changes, with the seed fixed.</p></div>
    <div><img class="shot" src="${await image('studio-proposal.jpg')}" alt=""><p class="caption">A plain-language direction becomes a diff to approve; locked fields are skipped.</p></div>
    <div><img class="shot" src="${await image('studio-viewer.jpg')}" alt=""><p class="caption">The viewer: judge with P/X/F and see how this take’s direction differs.</p></div>
    <div><img class="shot" src="${await image('create-edit.jpg')}" alt=""><p class="caption">Part A’s Edit tab: describe a change, compare before and after.</p></div>
  </div>
  <h3>Engineering highlights</h3>
  <ul>
    <li>Every page is prerendered as static HTML (Cache Components), so the first paint needs no client fetch; only API routes run per request.</li>
    <li>Studio uses a 40-line external store with selector subscriptions over normalized state, so rating a take re-renders only that card.</li>
    <li>Native <code>&lt;dialog&gt;</code> and the Popover API give real focus trapping and top-layer menus without a UI kit. Runtime dependencies: Next, React, Lucide and tailwind-merge.</li>
    <li>WAI-ARIA listbox, menu, radiogroup, toolbar and slider patterns; full keyboard support; AA contrast tokens; reduced-motion support.</li>
  </ul>
</section>

<section class="thinking">
  <div class="eyebrow">Product Thinking Document</div>
  ${thinking}
</section>

</body></html>`;

/* --------------------------------------------------------------- pdf --- */

const htmlFile = path.join(ROOT, '.cache', 'submission.html');
await mkdir(path.dirname(htmlFile), { recursive: true });
await writeFile(htmlFile, html);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
await page.goto(`file://${htmlFile}`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({
  path: out,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate:
    '<div style="width:100%;font-size:7.5pt;color:#9a8f88;padding:0 16mm;display:flex;justify-content:space-between;font-family:Helvetica,Arial,sans-serif"><span>Fomi · Frontend Developer Technical Assessment</span><span class="pageNumber"></span></div>',
});
await browser.close();
console.log(`✓ ${path.relative(process.cwd(), out)}\n  live: ${live}\n  repo: ${repo}`);
