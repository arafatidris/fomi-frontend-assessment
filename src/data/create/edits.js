/**
 * Mock edit "models": each recipe is a CSS filter plus an optional tinted
 * overlay. Instructions are matched by keyword, the same way the generation
 * mock matches prompts to result pools.
 */
export const EDIT_RECIPES = {
  golden: {
    label: 'Golden hour',
    filter: 'sepia(0.32) saturate(1.35) hue-rotate(-10deg) brightness(1.05) contrast(1.05)',
    overlay: 'radial-gradient(circle at 70% 30%, rgb(255 190 120 / 0.45), transparent 60%)',
    keywords: ['golden', 'warm', 'warmer', 'sunset', 'sunrise', 'sun', 'summer'],
  },
  blue: {
    label: 'Blue hour',
    filter: 'hue-rotate(10deg) saturate(0.8) brightness(0.82) contrast(1.12)',
    overlay: 'linear-gradient(to bottom, rgb(30 50 110 / 0.4), rgb(30 50 110 / 0.15))',
    keywords: ['blue', 'night', 'cold', 'cool', 'cooler', 'winter', 'dusk', 'moon'],
  },
  cinematic: {
    label: 'Cinematic',
    filter: 'contrast(1.18) saturate(1.12) brightness(0.96)',
    overlay: 'linear-gradient(135deg, rgb(0 120 140 / 0.28), transparent 45%, rgb(255 140 60 / 0.25))',
    keywords: ['cinematic', 'film', 'movie', 'teal', 'orange', 'dramatic', 'epic'],
  },
  mono: {
    label: 'Black & white',
    filter: 'grayscale(1) contrast(1.15) brightness(1.02)',
    keywords: ['black', 'white', 'bw', 'mono', 'monochrome', 'grayscale', 'noir'],
  },
  vivid: {
    label: 'Vivid',
    filter: 'saturate(1.6) contrast(1.08) brightness(1.03)',
    keywords: ['vivid', 'vibrant', 'pop', 'colorful', 'colourful', 'bright', 'punchy'],
  },
  soft: {
    label: 'Soft & dreamy',
    filter: 'brightness(1.08) saturate(0.82) contrast(0.9)',
    overlay: 'radial-gradient(circle at 50% 40%, rgb(255 255 255 / 0.35), transparent 70%)',
    keywords: ['soft', 'dreamy', 'dream', 'pastel', 'airy', 'gentle', 'haze'],
  },
  vintage: {
    label: 'Vintage film',
    filter: 'sepia(0.45) contrast(0.88) brightness(1.06) saturate(0.82)',
    keywords: ['vintage', 'retro', 'old', 'faded', 'nostalgic', '70s', 'analog'],
  },
  moody: {
    label: 'Moody',
    filter: 'brightness(0.8) contrast(1.28) saturate(0.7)',
    overlay: 'radial-gradient(circle, transparent 45%, rgb(0 0 0 / 0.45))',
    keywords: ['moody', 'dark', 'darker', 'gloomy', 'storm', 'shadow', 'mysterious'],
  },
};

export const QUICK_EDITS = ['golden', 'cinematic', 'mono', 'vivid', 'soft', 'moody'];

/** Picks four recipes for an instruction: keyword matches first, then a spread. */
export function recipesFor(instruction) {
  const words = new Set(instruction.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  const matched = Object.entries(EDIT_RECIPES)
    .filter(([, recipe]) => recipe.keywords.some((keyword) => words.has(keyword)))
    .map(([id]) => id);
  const spread = ['cinematic', 'golden', 'vivid', 'moody', 'soft', 'blue'];
  return [...new Set([...matched, ...spread])].slice(0, 4);
}
