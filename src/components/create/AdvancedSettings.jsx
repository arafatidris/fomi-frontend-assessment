'use client';

import { useId } from 'react';
import { Dices } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { IconButton } from '@/components/ui/IconButton';
import { useComposer } from './CreateProvider';

/** Power settings, collapsed by default so they never crowd the prompt. */
export function AdvancedSettings() {
  const id = useId();
  const { composer, updateComposer } = useComposer();
  const isVideo = composer.mode === 'video';
  const fixedSeed = composer.seed !== null;

  return (
    <div className="space-y-4 px-1 pb-1 pt-3">
      <div>
        <label htmlFor={`${id}-negative`} className="mb-1.5 block text-xs font-medium text-ink-2">
          Avoid
        </label>
        <textarea
          id={`${id}-negative`}
          value={composer.negativePrompt}
          onChange={(event) => updateComposer({ negativePrompt: event.target.value })}
          rows={2}
          placeholder="Things to keep out: text, watermark, blur…"
          className="w-full resize-none rounded-xl border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-line-strong"
        />
      </div>

      {isVideo ? (
        <div>
          <span id={`${id}-motion`} className="mb-1.5 block text-xs font-medium text-ink-2">
            Motion
          </span>
          <SegmentedControl
            label="Motion strength"
            value={composer.motion}
            onChange={(motion) => updateComposer({ motion })}
            options={[
              { value: 'low', label: 'Subtle' },
              { value: 'medium', label: 'Natural' },
              { value: 'high', label: 'Dynamic' },
            ]}
          />
        </div>
      ) : (
        <>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor={`${id}-guidance`} className="text-xs font-medium text-ink-2">
                Prompt strength
              </label>
              <output htmlFor={`${id}-guidance`} className="text-xs font-semibold tabular text-ink">
                {composer.guidance}
              </output>
            </div>
            <input
              id={`${id}-guidance`}
              type="range"
              min={1}
              max={15}
              step={0.5}
              value={composer.guidance}
              onChange={(event) => updateComposer({ guidance: Number(event.target.value) })}
              className="w-full accent-[var(--c-accent-solid)]"
            />
            <div className="mt-0.5 flex justify-between text-[11px] text-ink-2">
              <span>Creative</span>
              <span>Literal</span>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-ink-2">Quality</span>
            <SegmentedControl
              label="Quality"
              value={composer.quality}
              onChange={(quality) => updateComposer({ quality })}
              options={[
                { value: 'standard', label: 'Standard' },
                { value: 'hd', label: 'HD · 2×' },
              ]}
            />
          </div>
        </>
      )}

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor={`${id}-seed`} className="text-xs font-medium text-ink-2">
            Seed
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-2">
            <input
              type="checkbox"
              checked={!fixedSeed}
              onChange={(event) => updateComposer({ seed: event.target.checked ? null : 42 })}
              className="size-3.5 accent-[var(--c-accent-solid)]"
            />
            Random
          </label>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            id={`${id}-seed`}
            type="number"
            inputMode="numeric"
            min={0}
            max={99999}
            disabled={!fixedSeed}
            value={fixedSeed ? composer.seed : ''}
            placeholder="Random each time"
            onChange={(event) => updateComposer({ seed: Math.min(99999, Math.max(0, Math.trunc(Number(event.target.value) || 0))) })}
            className="h-9 w-full rounded-xl border border-line bg-surface px-3 text-[13px] tabular text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-line-strong disabled:opacity-60"
          />
          <IconButton
            label="Roll a new seed"
            icon={Dices}
            variant="surface"
            onClick={() => updateComposer({ seed: Math.floor(Math.random() * 99999) })}
          />
        </div>
      </div>
    </div>
  );
}
