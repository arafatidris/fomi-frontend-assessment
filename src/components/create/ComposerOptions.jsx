'use client';

import { Hash, Timer } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { ASPECT_RATIOS } from '@/lib/media/aspect-ratios';
import { getModel, getModelsFor } from '@/data/create/models';
import { cn } from '@/lib/utils/cn';
import { useComposer } from './CreateProvider';
import { RatioIcon } from './RatioIcon';

const COUNT_OPTIONS = [1, 2, 3, 4].map((count) => ({
  value: count,
  label: `${count} ${count === 1 ? 'image' : 'images'}`,
  description: count === 4 ? 'More to choose from' : count === 1 ? 'Fastest' : undefined,
}));

const DURATION_OPTIONS = [
  { value: 5, label: '5 seconds', description: 'Loops, social clips' },
  { value: 10, label: '10 seconds', description: 'Establishing shots' },
];

const VIDEO_RATIOS = new Set(['16:9', '9:16', '1:1', '4:5', '21:9']);

/** The row of compact settings under the prompt: count/duration, ratio, model. */
export function ComposerOptions({ className, placement = 'bottom-start' }) {
  const { composer, updateComposer } = useComposer();
  const isVideo = composer.mode === 'video';
  const ratioKey = isVideo ? 'videoAspectRatio' : 'imageAspectRatio';
  const modelKey = isVideo ? 'videoModel' : 'imageModel';

  const ratioOptions = ASPECT_RATIOS.filter((ratio) => !isVideo || VIDEO_RATIOS.has(ratio.id)).map((ratio) => ({
    value: ratio.id,
    label: ratio.id,
    description: ratio.label,
    icon: (props) => <RatioIcon ratio={ratio.id} {...props} />,
  }));

  const modelOptions = getModelsFor(composer.mode).map((model) => ({
    value: model.id,
    label: model.name,
    description: model.description,
  }));

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {isVideo ? (
        <Select
          label="Duration"
          value={composer.duration}
          options={DURATION_OPTIONS}
          onChange={(duration) => updateComposer({ duration })}
          placement={placement}
          renderValue={(option) => (
            <span className="flex items-center gap-1">
              <Timer aria-hidden className="size-3.5 text-ink-3" />
              {option.value}s
            </span>
          )}
        />
      ) : (
        <Select
          label="Number of images"
          value={composer.count}
          options={COUNT_OPTIONS}
          onChange={(count) => updateComposer({ count })}
          placement={placement}
          renderValue={(option) => (
            <span className="flex items-center gap-1">
              <Hash aria-hidden className="size-3.5 text-ink-3" />
              {option.value} Images
            </span>
          )}
        />
      )}
      <Select
        label="Aspect ratio"
        value={composer[ratioKey]}
        options={ratioOptions}
        onChange={(value) => updateComposer({ [ratioKey]: value })}
        placement={placement}
        renderValue={(option) => (
          <span className="flex items-center gap-1">
            <RatioIcon ratio={option.value} className="size-3.5 text-ink-3" />
            {option.label}
          </span>
        )}
      />
      <Select
        label="Model"
        value={composer[modelKey]}
        options={modelOptions}
        onChange={(value) => updateComposer({ [modelKey]: value })}
        placement={placement}
        menuClassName="w-64"
        className="min-w-36 flex-1 justify-between"
        renderValue={(option) => (
          <span className="truncate">
            <span className="text-ink-2">Model: </span>
            <span className="font-semibold">{option?.label ?? getModel(composer[modelKey])?.name}</span>
          </span>
        )}
      />
    </div>
  );
}
