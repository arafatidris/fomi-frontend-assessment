'use client';

import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { useCatalog } from './CatalogContext';
import { useComposer } from './CreateProvider';

const SUGGESTIONS = {
  image: [
    'A golden retriever puppy tumbling through autumn leaves, warm afternoon light',
    'Snow-capped alpine peaks at first light, ultra-wide landscape photography',
    'A rain-soaked neon street at night, cinematic reflections, 35mm',
  ],
  video: [
    'Slow drone flight over misty mountain ridges at sunrise',
    'A jellyfish drifting through deep blue water, slow push-in',
    'Aurora curtains rippling over a snowy ridge, cinematic',
  ],
};

const COPY = {
  all: { title: 'Your canvas is empty', body: 'Describe anything and Fomi will render it in seconds.' },
  image: { title: 'No images yet', body: 'Start with a few words, then refine. Try one of these:' },
  video: { title: 'No videos yet', body: 'Describe a scene and how the camera should move. Try:' },
};

/** First-run and filtered-empty state: shows what's possible and one-click prompts to start. */
export function EmptyState({ type }) {
  const { community } = useCatalog();
  const { updateComposer, focusPrompt } = useComposer();
  const mode = type === 'video' ? 'video' : 'image';
  const copy = COPY[type];

  const start = (prompt) => {
    updateComposer({ prompt, mode });
    requestAnimationFrame(focusPrompt);
  };

  return (
    <section className="flex flex-col items-center rounded-3xl border border-dashed border-line-strong px-6 py-14 text-center sm:py-20">
      <div aria-hidden className="relative mb-8 h-28 w-56">
        {community.slice(0, 3).map((pick, index) => (
          <span
            key={pick.id}
            className="absolute top-0 size-24 overflow-hidden rounded-2xl shadow-float ring-4 ring-canvas"
            style={{ left: `${index * 64}px`, transform: `rotate(${(index - 1) * 8}deg) translateY(${index === 1 ? -6 : 6}px)` }}
          >
            <Image src={pick.media.src} alt="" fill sizes="96px" quality={60} className="object-cover" />
          </span>
        ))}
      </div>
      <h1 className="text-xl font-semibold text-ink">{copy.title}</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-2">{copy.body}</p>
      <ul className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
        {SUGGESTIONS[mode].map((prompt) => (
          <li key={prompt}>
            <button
              type="button"
              onClick={() => start(prompt)}
              className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-left text-[13px] text-ink shadow-card transition-[border-color,transform] duration-150 hover:border-line-strong active:scale-[0.98]"
            >
              {prompt}
              <ArrowUpRight aria-hidden className="size-3.5 shrink-0 text-ink-3 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
