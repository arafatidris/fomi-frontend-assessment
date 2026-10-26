'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useModKey } from '@/hooks/useHotkeys';
import { cn } from '@/lib/utils/cn';
import { useComposer, useWorkspace } from './CreateProvider';

const PROMPT_MAX = 1500;

/**
 * The prompt box with its Generate button. ⌘/Ctrl+Enter submits; renders can
 * be queued back to back, so the button stays live and shows what's running.
 */
export function PromptField({ variant = 'panel', onGenerated }) {
  const id = useId();
  const mod = useModKey();
  const { composer, updateComposer, generate, registerPromptField } = useComposer();
  const fieldRef = useRef(null);
  const { created } = useWorkspace();
  const [shake, setShake] = useState(false);
  const running = created.filter((item) => item.status === 'pending').length;
  const isVideo = composer.mode === 'video';
  const length = composer.prompt.length;

  useEffect(() => registerPromptField(fieldRef.current), [registerPromptField]);

  // Auto-grow the docked field (field-sizing covers Chromium; this covers Safari).
  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (variant !== 'dock' || !field) return;
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }, [variant, composer.prompt]);

  const submit = () => {
    if (generate()) onGenerated?.();
    else {
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
  };

  const placeholder = isVideo
    ? 'Describe a scene and how the camera should move…'
    : 'Describe your imagination, and we’ll turn it into a piece of art…';

  return (
    <div
      className={cn(
        'group/prompt relative flex flex-col bg-surface transition-[box-shadow,border-color] duration-200',
        variant === 'panel'
          ? 'min-h-44 rounded-2xl border-[1.5px] border-field shadow-[0_6px_0_-2px_var(--c-panel-2),0_8px_18px_-10px_rgb(60_35_25/0.35)] focus-within:shadow-[0_6px_0_-2px_var(--c-panel-2),0_0_0_4px_color-mix(in_oklab,var(--c-accent)_28%,transparent)]'
          : 'rounded-[1.4rem] border border-line-strong shadow-pop focus-within:border-field',
        shake && 'animate-shake',
      )}
    >
      <label htmlFor={id} className="sr-only">
        {isVideo ? 'Describe your video' : 'Describe your image'}
      </label>
      <textarea
        ref={fieldRef}
        id={id}
        value={composer.prompt}
        maxLength={PROMPT_MAX}
        onChange={(event) => updateComposer({ prompt: event.target.value })}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        rows={variant === 'panel' ? 5 : 1}
        className={cn(
          'w-full flex-1 resize-none bg-transparent text-ink outline-none placeholder:text-ink-3',
          variant === 'panel'
            ? 'px-4 pt-3.5 text-[13.5px] leading-relaxed'
            : 'field-sizing-content max-h-32 min-h-11 px-4 py-3 text-[15px] leading-snug',
        )}
      />

      <div className={cn('flex items-center gap-2', variant === 'panel' ? 'px-3 pb-3 pt-1' : 'px-2 pb-2')}>
        <span className="hidden min-w-0 flex-1 truncate pl-1 text-[11px] text-ink-3 sm:block">
          {length > PROMPT_MAX * 0.8 ? (
            <span className={cn('tabular', length >= PROMPT_MAX && 'text-danger')}>
              {length}/{PROMPT_MAX}
            </span>
          ) : (
            variant === 'panel' && (
              <span className="opacity-0 transition-opacity duration-200 group-focus-within/prompt:opacity-100">
                {mod}↵ to generate
              </span>
            )
          )}
        </span>
        <span className="flex-1 sm:hidden" />
        <button
          type="button"
          onClick={submit}
          className={cn(
            'relative inline-flex h-9 shrink-0 items-center gap-1.5 overflow-hidden rounded-full bg-accent-solid pl-3.5 pr-4 text-[13px] font-semibold text-on-accent',
            'shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_6px_14px_-6px_color-mix(in_oklab,var(--c-accent-solid)_80%,transparent)]',
            'transition-[background-color,transform,box-shadow] duration-150 hover:bg-accent-solid-hover active:scale-[0.96]',
            'before:absolute before:inset-0 before:-translate-x-full before:bg-linear-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700 hover:before:translate-x-full',
          )}
        >
          <Sparkles aria-hidden className="size-4" />
          <span>Generate</span>
          {running > 0 && (
            <span className="ml-0.5 rounded-full bg-white/20 px-1.5 text-[11px] tabular" aria-label={`${running} rendering`}>
              {running}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
