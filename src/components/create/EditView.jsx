'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Check, ImageUp, Layers, Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { EDIT_RECIPES, QUICK_EDITS, recipesFor } from '@/data/create/edits';
import { cn } from '@/lib/utils/cn';
import { truncate } from '@/lib/utils/format';
import { useCatalog } from './CatalogContext';
import { useWorkspace } from './CreateProvider';
import { CompareSlider } from './CompareSlider';
import { ProgressRing } from './ProgressRing';

const RENDER_MS = 1800;

/** Composes a chain of recipes into one CSS filter plus stacked overlays. */
function look(recipeIds) {
  const recipes = recipeIds.map((id) => EDIT_RECIPES[id]);
  return {
    filter: recipes.map((recipe) => recipe.filter).join(' ') || 'none',
    overlays: recipes.map((recipe) => recipe.overlay).filter(Boolean),
  };
}

function Picture({ source, recipes = [], sizes, priority, cover = false }) {
  const { filter, overlays } = look(recipes);
  return (
    <>
      <Image
        src={source.src}
        alt={source.alt}
        fill
        sizes={sizes}
        quality={90}
        unoptimized={source.src.startsWith('blob:')}
        placeholder={source.blurDataURL ? 'blur' : 'empty'}
        blurDataURL={source.blurDataURL}
        loading={priority ? 'eager' : 'lazy'}
        className={cover ? 'object-cover' : 'object-contain'}
        style={{ filter }}
      />
      {overlays.map((overlay) => (
        <span key={overlay} aria-hidden className="absolute inset-0 mix-blend-soft-light" style={{ background: overlay }} />
      ))}
    </>
  );
}

/**
 * Image editing: pick a source, describe the change (or tap a quick edit),
 * get four variations and compare any of them against the original.
 */
export function EditView() {
  const id = useId();
  const { history } = useCatalog();
  const { created } = useWorkspace();
  const { toast } = useToast();
  const [source, setSource] = useState(null);
  const [instruction, setInstruction] = useState('');
  const [job, setJob] = useState(null); // { recipes } while an edit renders
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(0);
  const uploadRef = useRef(null);

  const images = useMemo(
    () =>
      [...created.filter((item) => item.status === 'succeeded'), ...history]
        .filter((generation) => generation.type === 'image')
        .flatMap((generation) => generation.outputs.map((output) => ({ ...output, alt: truncate(generation.prompt, 100) }))),
    [created, history],
  );

  // Simulated edit render: progress animates, then four variations land.
  useEffect(() => {
    if (!job) return;
    const started = performance.now();
    let frame;
    const tick = () => {
      const value = Math.min(1, (performance.now() - started) / RENDER_MS);
      setProgress(value);
      if (value < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      setResults(job.recipes.map((recipe) => ({ id: `${recipe}-${started}`, recipes: [...job.base, recipe] })));
      setSelected(0);
      setJob(null);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [job]);

  const choose = (image) => {
    setSource({ ...image, recipes: [] });
    setResults([]);
  };

  const onUpload = (file) => {
    if (!file?.type.startsWith('image/')) {
      toast({ tone: 'error', title: 'That file isn’t an image', description: 'Use a JPG, PNG or WebP.' });
      return;
    }
    choose({ id: `upload-${file.name}`, src: URL.createObjectURL(file), alt: file.name });
  };

  const run = (recipes) => {
    setProgress(0);
    setJob({ recipes, base: source.recipes });
  };

  const apply = () => {
    if (instruction.trim().length < 3) {
      toast({ tone: 'error', title: 'Describe the change', description: 'For example: “warmer, golden hour light”.' });
      return;
    }
    run(recipesFor(instruction));
  };

  const result = results[selected];

  if (!source) {
    return (
      <section aria-labelledby={`${id}-title`} className="mx-auto max-w-5xl">
        <h1 id={`${id}-title`} className="text-xl font-semibold">
          Edit an image
        </h1>
        <p className="mt-1 text-sm text-ink-2">Relight, regrade or restyle anything you’ve made, or bring your own.</p>

        <label
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onUpload(event.dataTransfer.files[0]);
          }}
          className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line-strong bg-surface/60 px-6 py-10 text-center transition-colors hover:border-accent hover:bg-accent-soft/40 focus-within:border-accent"
        >
          <ImageUp aria-hidden className="size-7 text-accent-ink" />
          <span className="text-sm font-semibold">Drop an image here, or browse</span>
          <span className="text-xs text-ink-2">JPG, PNG or WebP · stays on your device in this demo</span>
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => onUpload(event.target.files[0])}
          />
        </label>

        <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-ink-2">Or pick from your history</h2>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
          {images.slice(0, 28).map((image) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => choose(image)}
                aria-label={`Edit: ${image.alt}`}
                className="group relative block aspect-square w-full overflow-hidden rounded-xl bg-panel-2 transition-transform duration-200 active:scale-95"
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 9rem, (min-width: 640px) 20vw, 33vw"
                  quality={60}
                  placeholder="blur"
                  blurDataURL={image.blurDataURL}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section aria-label="Editor" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" icon={ArrowLeft} onClick={() => setSource(null)}>
            Choose another image
          </Button>
          {source.recipes.length > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-panel px-2.5 py-1 text-[11px] font-medium text-ink-2">
              <Layers aria-hidden className="size-3.5" />
              {source.recipes.map((recipe) => EDIT_RECIPES[recipe].label).join(' → ')}
            </span>
          )}
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-[#14110f] lg:aspect-auto lg:h-[calc(100dvh-var(--create-header-h,11rem)-12rem)] lg:min-h-96">
          {result && !job ? (
            <CompareSlider
              before={<Picture source={source} recipes={source.recipes} sizes="(min-width: 1024px) 60vw, 100vw" priority />}
              after={<Picture source={source} recipes={result.recipes} sizes="(min-width: 1024px) 60vw, 100vw" priority />}
            />
          ) : (
            <Picture source={source} recipes={source.recipes} sizes="(min-width: 1024px) 60vw, 100vw" priority />
          )}
          {job && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 text-white backdrop-blur-[2px]">
              <ProgressRing value={progress} size={44} showLabel className="text-white [&_span]:text-white" />
              <span className="text-xs font-medium">Applying edit…</span>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <ul aria-label="Variations" className="grid grid-cols-4 gap-2 sm:gap-3">
            {results.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelected(index)}
                  aria-pressed={index === selected}
                  aria-label={`Variation ${index + 1}: ${EDIT_RECIPES[item.recipes.at(-1)].label}`}
                  className={cn(
                    'group relative block aspect-[4/3] w-full animate-develop overflow-hidden rounded-xl bg-panel-2 ring-2 ring-transparent transition-[box-shadow,transform] duration-200 active:scale-95',
                    index === selected && 'ring-accent-solid',
                  )}
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <Picture source={source} recipes={item.recipes} sizes="12rem" cover />
                  <span className="absolute inset-x-1.5 bottom-1.5 truncate rounded-full bg-black/55 px-2 py-0.5 text-center text-[10px] font-semibold text-white backdrop-blur">
                    {EDIT_RECIPES[item.recipes.at(-1)].label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside aria-label="Edit controls" className="flex flex-col gap-4 rounded-[1.35rem] bg-panel p-4 lg:sticky lg:top-[calc(var(--create-header-h,11rem)+0.25rem)] lg:self-start">
        <div>
          <label htmlFor={`${id}-instruction`} className="mb-2 block text-sm font-semibold">
            Describe the change
          </label>
          <div className="rounded-2xl border-[1.5px] border-field bg-surface focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--c-accent)_28%,transparent)]">
            <textarea
              id={`${id}-instruction`}
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  apply();
                }
              }}
              rows={3}
              placeholder="e.g. warmer, golden hour light with a cinematic grade"
              className="w-full resize-none bg-transparent px-3.5 pt-3 text-[13.5px] leading-relaxed outline-none placeholder:text-ink-3"
            />
            <div className="flex justify-end px-2.5 pb-2.5">
              <Button variant="primary" size="sm" icon={Sparkles} loading={Boolean(job)} onClick={apply}>
                Apply edit
              </Button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-2">Quick edits</h2>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_EDITS.map((recipe) => (
              <button
                key={recipe}
                type="button"
                disabled={Boolean(job)}
                onClick={() => run([recipe, ...recipesFor(EDIT_RECIPES[recipe].label).filter((other) => other !== recipe)].slice(0, 4))}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium shadow-card transition-[border-color,transform] duration-150 hover:border-line-strong active:scale-95 disabled:opacity-50"
              >
                {EDIT_RECIPES[recipe].label}
              </button>
            ))}
          </div>
        </div>

        {result && !job && (
          <div className="space-y-2 border-t border-line pt-4">
            <Button
              variant="primary"
              className="w-full"
              icon={Layers}
              onClick={() => {
                setSource({ ...source, recipes: result.recipes });
                setResults([]);
                toast({ title: 'Edit applied', description: 'Keep refining from here.' });
              }}
            >
              Keep editing from this
            </Button>
            <Button
              className="w-full"
              icon={Check}
              onClick={() => toast({ tone: 'success', title: 'Saved to Assets', description: EDIT_RECIPES[result.recipes.at(-1)].label })}
            >
              Save to Assets
            </Button>
          </div>
        )}

        <button
          type="button"
          onClick={() => uploadRef.current?.click()}
          className="flex items-center justify-center gap-1.5 text-xs font-medium text-ink-2 transition-colors hover:text-ink"
        >
          <Upload aria-hidden className="size-3.5" />
          Upload a different image
        </button>
        <input ref={uploadRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(event) => onUpload(event.target.files[0])} />
      </aside>
    </section>
  );
}
