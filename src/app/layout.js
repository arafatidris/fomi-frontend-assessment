import './globals.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fomi-studio.vercel.app'),
  title: {
    default: 'Fomi — Create',
    template: '%s · Fomi',
  },
  description:
    'Fomi turns imagination into professional images and videos. Generate, refine and direct AI visuals in one fast, focused workspace.',
  applicationName: 'Fomi',
  openGraph: {
    title: 'Fomi — AI image & video workspace',
    description: 'Generate, refine and direct AI visuals in one fast, focused workspace.',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Keeps the docked mobile composer above the on-screen keyboard.
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf7f4' },
    { media: '(prefers-color-scheme: dark)', color: '#12100e' },
  ],
};

// Runs before first paint so a saved theme never flashes. Light is the
// default because it is the design the workspace was drawn in.
const THEME_SCRIPT = `try{if(localStorage.getItem('fomi-theme')==='dark')document.documentElement.dataset.theme='dark'}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
