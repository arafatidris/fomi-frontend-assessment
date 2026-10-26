/**
 * Style presets for the Create workspace. A style appends a short suffix to
 * the prompt server-side; `thumb` is the media path of a representative image.
 * Presets with a `source` get a dedicated thumbnail from `npm run media:build`.
 */
export const STYLE_PRESETS = [
  { id: 'cinematic', label: 'Cinematic', suffix: 'cinematic lighting, anamorphic lens, film still', thumb: 'create/g09-1' },
  { id: 'portrait', label: 'Portrait', suffix: 'editorial portrait, 85mm, soft key light', thumb: 'create/g01-2' },
  { id: 'film', label: 'Analog film', suffix: 'shot on Kodak Portra, natural grain', thumb: 'create/g02-3' },
  { id: 'golden', label: 'Golden hour', suffix: 'golden hour, warm low sun, soft haze', thumb: 'create/g06-1' },
  { id: 'fantasy', label: 'Fantasy', suffix: 'ethereal fantasy art, volumetric light', thumb: 'create/g15-1' },
  { id: 'neon', label: 'Neon noir', suffix: 'neon noir, wet streets, high contrast', thumb: 'create/pool-city-1' },
  { id: 'landscape', label: 'Landscape', suffix: 'epic landscape photography, wide angle', thumb: 'create/g13-1' },
  { id: 'astro', label: 'Night sky', suffix: 'astrophotography, long exposure, crisp stars', thumb: 'create/pool-space-1' },
  {
    id: 'mono',
    label: 'Monochrome',
    suffix: 'black and white fine-art photography, rich tonal range',
    thumb: 'styles/mono',
    source: { picsum: 1027, focus: [0.5, 0.32], grade: ['mono'] },
  },
  { id: 'minimal', label: 'Minimal', suffix: 'minimalist composition, soft neutral palette', thumb: 'create/g11-2' },
  { id: 'product', label: 'Product', suffix: 'premium product photography, seamless backdrop', thumb: 'create/g16-2' },
];

const BY_ID = new Map(STYLE_PRESETS.map((style) => [style.id, style]));

export function getStyle(id) {
  return id ? BY_ID.get(id) ?? null : null;
}
