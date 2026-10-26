import { ImageResponse } from 'next/og';

export const alt = 'Fomi: AI image and video workspace';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Social preview card, rendered once at build time. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #faf7f4 0%, #f6eae4 55%, #efd3c6 100%)',
          color: '#1c1917',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: '#1c1917', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800 }}>
            F
          </div>
          <span style={{ fontSize: 30, fontWeight: 700 }}>Fomi</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{ fontSize: 68, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>Create, then direct.</span>
          <span style={{ fontSize: 30, color: '#57504b', maxWidth: 900 }}>
            A generation workspace built from the design, and Fomi Studio: lock what works, explore one variable at a time, review at keyboard speed.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {['#c0533b', '#e8917b', '#1c1917', '#5fd4a0'].map((color) => (
            <div key={color} style={{ width: 120, height: 14, borderRadius: 7, background: color }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
