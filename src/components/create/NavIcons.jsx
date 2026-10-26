/**
 * Navigation glyphs with outline and filled states: the active tab fills in,
 * the same way Instagram signals "you are here" without extra chrome.
 * Details on filled shapes are cut out with the canvas color.
 */
const PATHS = {
  home: ({ filled }) => (
    <path
      d="M4 10.4 11.3 4a1 1 0 0 1 1.4 0l7.3 6.4V19.5a1.5 1.5 0 0 1-1.5 1.5h-4v-5.5h-5V21h-4A1.5 1.5 0 0 1 4 19.5Z"
      fill={filled ? 'currentColor' : 'none'}
    />
  ),
  image: ({ filled }) => (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" fill={filled ? 'currentColor' : 'none'} />
      <path d="m4 17 4.6-4.8 3.6 3.6 2.4-2.3L20 18" stroke={filled ? 'var(--c-canvas)' : 'currentColor'} />
      <circle cx="15.5" cy="9" r="1.4" fill={filled ? 'var(--c-canvas)' : 'currentColor'} stroke="none" />
    </>
  ),
  video: ({ filled }) => (
    <>
      <rect x="2.5" y="6" width="13" height="12" rx="2.5" fill={filled ? 'currentColor' : 'none'} />
      <path d="m15.5 10.2 4.6-2.6a.6.6 0 0 1 .9.5v7.8a.6.6 0 0 1-.9.5l-4.6-2.6" fill={filled ? 'currentColor' : 'none'} />
    </>
  ),
  edit: ({ filled }) => (
    <>
      <path d="m4 20 10.5-10.5" strokeWidth={filled ? 2.6 : 2} />
      <path
        d="m15.7 3.5.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"
        fill={filled ? 'currentColor' : 'none'}
        strokeWidth="1.6"
      />
      <path d="M19.5 11.5v2M18.5 12.5h2" strokeWidth="1.6" />
    </>
  ),
  assets: ({ filled }) => (
    <path
      d="M3.5 6.7A1.7 1.7 0 0 1 5.2 5h4l2.2 2.3h7.4a1.7 1.7 0 0 1 1.7 1.7v9.3a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7Z"
      fill={filled ? 'currentColor' : 'none'}
    />
  ),
};

export function NavIcon({ name, filled = false, className }) {
  const Glyph = PATHS[name];
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Glyph filled={filled} />
    </svg>
  );
}
