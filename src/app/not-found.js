import Link from 'next/link';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center text-ink">
      <p className="font-mono text-sm text-ink-3">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">This page drifted out of frame</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-2">The link may be old, or the page was never rendered. Your work is safe.</p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-full bg-accent-solid px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-solid-hover"
        >
          Back to Create
        </Link>
        <Link href="/studio" className="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium transition-colors hover:border-line-strong">
          Open Studio
        </Link>
      </div>
    </main>
  );
}
