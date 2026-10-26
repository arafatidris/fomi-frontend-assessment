import { IBM_Plex_Mono, Plus_Jakarta_Sans } from 'next/font/google';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Studio',
  description: 'Fomi Studio: direct AI imagery like a creative director. Lock what works, explore one variable at a time, and review takes at keyboard speed.',
};

export default function StudioLayout({ children }) {
  return (
    <div
      data-product="studio"
      className={`studio ${sans.variable} ${mono.variable} h-dvh overflow-hidden bg-canvas font-sans text-ink [--font-ui-mono:var(--font-plex-mono)] [--font-ui:var(--font-jakarta)]`}
    >
      {children}
    </div>
  );
}
