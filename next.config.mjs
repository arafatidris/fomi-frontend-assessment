/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    // AVIF first (smallest), WebP as the fallback.
    formats: ['image/avif', 'image/webp'],
    // 60 for thumbnails and history, 75 default, 90 for the full-screen viewer.
    qualities: [60, 75, 90],
    imageSizes: [48, 64, 96, 128, 192, 256, 384],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    // Tailwind keeps the stylesheet small (~15 KB gzip), so shipping it inside the
    // HTML removes a render-blocking request for first-time visitors.
    inlineCss: true,
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async headers() {
    return [
      {
        source: '/media/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
