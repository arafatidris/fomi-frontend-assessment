/**
 * Seed library for the Create workspace.
 *
 * Each output lists where its pixels come from so `npm run media:build` can
 * reproduce /public/media from scratch:
 *   - `file`   a committed original (the g01 portraits are genuine FLUX.1
 *              [schnell] renders of the g01 prompt)
 *   - `picsum` an Unsplash-licensed photo served by picsum.photos, cropped to
 *              the generation's aspect ratio around `focus` (0–1 coordinates)
 *
 * `minutesAgo` keeps the demo feeling fresh: the client resolves it against
 * the current time after hydration.
 */
export const SEED_GENERATIONS = [
  {
    id: 'g01',
    type: 'image',
    prompt:
      'A professional portrait photograph of a smiling 31-year-old redheaded woman with warm brown eyes and softly tousled auburn hair framing her face. She is turned slightly towards the viewer, offering a genuine and approachable expression. She is wearing a cream-colored cashmere sweater and delicate gold earrings. The background is a softly blurred expanse of muted gray and beige tones, suggesting a modern art gallery. There is subtle directional lighting.',
    modelId: 'fomi-portrait',
    aspectRatio: '3:4',
    styleId: 'portrait',
    minutesAgo: 3,
    outputs: [
      { seed: 1101, source: { file: 'flux/g01-a.webp' } },
      { seed: 1102, source: { file: 'flux/g01-b.webp' } },
      { seed: 1103, source: { file: 'flux/g01-c.webp' } },
      { seed: 1104, source: { file: 'flux/g01-b.webp', flip: true, zoom: 1.12, focus: [0.5, 0.42] } },
    ],
  },
  {
    id: 'g02',
    type: 'image',
    prompt:
      'Fine-art portrait of a young woman lost in thought, soft natural window light, muted film tones and a shallow depth of field. Intimate, quiet and cinematic.',
    modelId: 'fomi-portrait',
    aspectRatio: '3:4',
    styleId: 'film',
    minutesAgo: 14,
    outputs: [
      { seed: 1201, source: { picsum: 1027, focus: [0.5, 0.3] } },
      { seed: 1202, source: { picsum: 978, focus: [0.5, 0.3] } },
      { seed: 1203, source: { picsum: 832, focus: [0.62, 0.5] } },
      { seed: 1204, source: { picsum: 64, focus: [0.46, 0.5] } },
    ],
  },
  {
    id: 'g03',
    type: 'image',
    prompt:
      'A woman with long sun-kissed hair in a summer meadow at golden hour, backlit by a low sun with a warm lens flare. Dreamy, nostalgic summer mood.',
    modelId: 'fomi-realism',
    aspectRatio: '4:3',
    styleId: 'film',
    minutesAgo: 43,
    outputs: [
      { seed: 1301, source: { picsum: 646, focus: [0.5, 0.45] } },
      { seed: 1302, source: { picsum: 777, focus: [0.62, 0.5] } },
    ],
  },
  {
    id: 'g04',
    type: 'image',
    prompt:
      'Bioluminescent jellyfish drifting through deep blue water, glowing tendrils trailing behind them, quiet and otherworldly underwater photography.',
    modelId: 'fomi-lumen-2',
    aspectRatio: '4:3',
    styleId: 'fantasy',
    minutesAgo: 78,
    outputs: [
      { seed: 1401, source: { picsum: 1069, focus: [0.55, 0.5] } },
      { seed: 1402, source: { picsum: 881, focus: [0.5, 0.55] } },
      { seed: 1403, source: { picsum: 581, focus: [0.5, 0.45] } },
    ],
  },
  {
    id: 'v01',
    type: 'video',
    prompt:
      'A lone jellyfish pulsing slowly through the deep blue ocean, shafts of light from the surface, slow push-in.',
    modelId: 'fomi-motion-2',
    aspectRatio: '16:9',
    styleId: 'cinematic',
    minutesAgo: 101,
    outputs: [{ seed: 5101, duration: 5, source: { picsum: 881, focus: [0.5, 0.55], motion: 'push-in' } }],
  },
  {
    id: 'g05',
    type: 'image',
    prompt:
      'Vivid green northern lights swirling over a snowy ridge and pine silhouettes, a deep starry polar night. Long-exposure landscape photography.',
    modelId: 'fomi-realism',
    aspectRatio: '1:1',
    styleId: 'landscape',
    minutesAgo: 136,
    outputs: [
      { seed: 1501, source: { picsum: 901, focus: [0.5, 0.5] } },
      { seed: 1502, source: { picsum: 1022, focus: [0.6, 0.5] } },
      { seed: 1503, source: { picsum: 724, focus: [0.42, 0.5] } },
    ],
  },
  {
    id: 'g06',
    type: 'image',
    prompt:
      'Red deer grazing in a misty meadow at sunrise, everything glowing amber through thick golden fog. Painterly wildlife photography.',
    modelId: 'fomi-realism',
    aspectRatio: '3:2',
    styleId: 'cinematic',
    minutesAgo: 190,
    outputs: [
      { seed: 1601, source: { picsum: 943, focus: [0.5, 0.55] } },
      { seed: 1602, source: { picsum: 790, focus: [0.55, 0.55] } },
    ],
  },
  {
    id: 'g07',
    type: 'image',
    prompt:
      'A sleepy pug wrapped in a cozy plaid blanket like a tiny grandpa, soft natural light, shallow depth of field. Adorable and slightly grumpy.',
    modelId: 'fomi-lumen-2',
    aspectRatio: '3:2',
    styleId: null,
    minutesAgo: 248,
    outputs: [
      { seed: 1701, source: { picsum: 1025, focus: [0.5, 0.45] } },
      { seed: 1702, source: { picsum: 1062, focus: [0.5, 0.45] } },
    ],
  },
  {
    id: 'v02',
    type: 'video',
    prompt:
      'Aerial drift over a glowing city skyline at dusk, a burning sunset behind dramatic clouds, light trails on the highways below.',
    modelId: 'fomi-motion-2',
    aspectRatio: '16:9',
    styleId: 'cinematic',
    minutesAgo: 305,
    outputs: [{ seed: 5201, duration: 5, source: { picsum: 857, focus: [0.5, 0.55], motion: 'pan-right' } }],
  },
  {
    id: 'g08',
    type: 'image',
    prompt:
      'Low-key portrait of a husky at dusk, piercing eyes, rim light catching its fur against a dark forest background.',
    modelId: 'fomi-realism',
    aspectRatio: '16:9',
    styleId: 'cinematic',
    minutesAgo: 1462,
    outputs: [{ seed: 1801, source: { picsum: 659, focus: [0.55, 0.45] } }],
  },
  {
    id: 'g09',
    type: 'image',
    prompt:
      'Long-exposure city skyline at blue hour, illuminated suspension bridges and glowing reflections on the water. Cinematic night photography.',
    modelId: 'fomi-lumen-2',
    aspectRatio: '16:9',
    styleId: 'cinematic',
    minutesAgo: 1528,
    outputs: [
      { seed: 1901, source: { picsum: 857, focus: [0.5, 0.6] } },
      { seed: 1902, source: { picsum: 249, focus: [0.5, 0.55] } },
      { seed: 1903, source: { picsum: 84, focus: [0.55, 0.5] } },
    ],
  },
  {
    id: 'g10',
    type: 'image',
    prompt:
      'The Golden Gate Bridge rising out of a thick blanket of rolling fog, red towers against a pale sky. Travel photography, soft morning light.',
    modelId: 'fomi-lumen-2',
    aspectRatio: '4:3',
    styleId: 'landscape',
    minutesAgo: 1595,
    outputs: [
      { seed: 2001, source: { picsum: 693, focus: [0.48, 0.5] } },
      { seed: 2002, source: { picsum: 744, focus: [0.45, 0.5] } },
      { seed: 2003, source: { picsum: 613, focus: [0.5, 0.4] } },
    ],
  },
  {
    id: 'v03',
    type: 'video',
    prompt:
      'Low clouds rolling slowly through a dense pine forest on a mountainside, moody and atmospheric, gentle lateral camera move.',
    modelId: 'fomi-motion-fast',
    aspectRatio: '16:9',
    styleId: 'landscape',
    minutesAgo: 1688,
    outputs: [{ seed: 5301, duration: 5, source: { picsum: 932, focus: [0.5, 0.45], motion: 'pan-left' } }],
  },
  {
    id: 'g11',
    type: 'image',
    prompt:
      'Sweeping desert dunes with razor-sharp ridgelines in warm light, a tiny caravan of travellers for scale. Minimal, graphic landscape photography.',
    modelId: 'fomi-realism',
    aspectRatio: '4:3',
    styleId: 'minimal',
    minutesAgo: 1802,
    outputs: [
      { seed: 2101, source: { picsum: 525, focus: [0.5, 0.55] } },
      { seed: 2102, source: { picsum: 261, focus: [0.5, 0.5] } },
      { seed: 2103, source: { picsum: 184, focus: [0.5, 0.55] } },
    ],
  },
  {
    id: 'g12',
    type: 'image',
    prompt:
      'Fog rolling through a pine forest at dawn, layers of mist between the trees, muted greens. Quiet, atmospheric landscape photography.',
    modelId: 'fomi-realism',
    aspectRatio: '16:9',
    styleId: 'landscape',
    minutesAgo: 2885,
    outputs: [
      { seed: 2201, source: { picsum: 634, focus: [0.5, 0.55] } },
      { seed: 2202, source: { picsum: 932, focus: [0.5, 0.5] } },
      { seed: 2203, source: { picsum: 923, focus: [0.5, 0.55] } },
    ],
  },
  {
    id: 'g13',
    type: 'image',
    prompt:
      'A thundering Icelandic waterfall with a rainbow arching through the mist and a lone traveller with arms raised at its foot. Epic, awe-struck mood.',
    modelId: 'fomi-realism',
    aspectRatio: '4:3',
    styleId: 'landscape',
    minutesAgo: 2992,
    outputs: [
      { seed: 2301, source: { picsum: 1035, focus: [0.5, 0.5] } },
      { seed: 2302, source: { picsum: 509, focus: [0.5, 0.5] } },
      { seed: 2303, source: { picsum: 1039, focus: [0.5, 0.5] } },
    ],
  },
  {
    id: 'v04',
    type: 'video',
    prompt:
      'Green aurora curtains rippling over a snowy mountain ridge under a starry sky, slow cinematic push-in.',
    modelId: 'fomi-motion-2',
    aspectRatio: '16:9',
    styleId: 'landscape',
    minutesAgo: 3110,
    outputs: [{ seed: 5401, duration: 5, source: { picsum: 901, focus: [0.5, 0.42], motion: 'push-in' } }],
  },
  {
    id: 'g14',
    type: 'image',
    prompt:
      'An aurora seen from orbit, a space station arm silhouetted against the curve of the Earth glowing green and violet. Ultra-detailed space photography.',
    modelId: 'fomi-lumen-2',
    aspectRatio: '3:2',
    styleId: 'cinematic',
    minutesAgo: 4392,
    outputs: [{ seed: 2401, source: { picsum: 967, focus: [0.5, 0.5] } }],
  },
  {
    id: 'g15',
    type: 'image',
    prompt:
      'A tiny mushroom glowing in soft morning light on a bed of moss, macro photography with dreamy bokeh. A miniature fairytale world.',
    modelId: 'fomi-realism',
    aspectRatio: '3:2',
    styleId: 'fantasy',
    minutesAgo: 4470,
    outputs: [{ seed: 2501, source: { picsum: 977, focus: [0.4, 0.5] } }],
  },
  {
    id: 'g16',
    type: 'image',
    prompt:
      'Barista craft coffee: a pour-over brewing in moody café light, latte art on a wooden counter, a steaming cup held in knitted mittens.',
    modelId: 'fomi-realism',
    aspectRatio: '4:3',
    styleId: 'product',
    minutesAgo: 5812,
    outputs: [
      { seed: 2601, source: { picsum: 1060, focus: [0.55, 0.5] } },
      { seed: 2602, source: { picsum: 431, focus: [0.45, 0.5] } },
      { seed: 2603, source: { picsum: 755, focus: [0.5, 0.5] } },
    ],
  },
  {
    id: 'g17',
    type: 'image',
    prompt:
      'Two wooden benches in a park carpeted with fiery orange autumn leaves, warm afternoon light filtering through the trees.',
    modelId: 'fomi-lumen-2',
    aspectRatio: '3:2',
    styleId: 'landscape',
    minutesAgo: 5904,
    outputs: [{ seed: 2701, source: { picsum: 553, focus: [0.5, 0.5] } }],
  },
];

/**
 * Renders the mock API draws from when you generate something new, so fresh
 * results don't simply repeat the feed. Pools are matched by prompt keywords;
 * `fallback` is used when nothing matches.
 */
export const RESULT_POOLS = [
  {
    id: 'pool-pets',
    keywords: ['dog', 'puppy', 'pet', 'pug', 'labrador', 'retriever', 'animal', 'cat', 'kitten'],
    sources: [{ picsum: 237 }, { picsum: 837 }, { picsum: 169 }, { picsum: 659 }],
  },
  {
    id: 'pool-ocean',
    keywords: ['ocean', 'sea', 'wave', 'beach', 'surf', 'water', 'coast', 'island'],
    sources: [{ picsum: 1041 }, { picsum: 973 }, { picsum: 912 }, { picsum: 970 }],
  },
  {
    id: 'pool-city',
    keywords: ['city', 'street', 'neon', 'night', 'urban', 'tokyo', 'york', 'cyberpunk', 'skyline'],
    sources: [{ picsum: 274 }, { picsum: 1029 }, { picsum: 862 }, { picsum: 43 }],
  },
  {
    id: 'pool-space',
    keywords: ['space', 'star', 'galaxy', 'astronaut', 'planet', 'cosmic', 'moon', 'universe', 'sky'],
    sources: [{ picsum: 981 }, { picsum: 825 }, { picsum: 967 }, { picsum: 903 }],
  },
  {
    id: 'pool-food',
    keywords: ['food', 'fruit', 'dessert', 'cake', 'berry', 'strawberry', 'restaurant', 'dish', 'breakfast'],
    sources: [{ picsum: 1080 }, { picsum: 429 }, { picsum: 889 }, { picsum: 493 }],
  },
  {
    id: 'pool-cars',
    keywords: ['car', 'vintage', 'road trip', 'van', 'vehicle', 'retro', 'drive'],
    sources: [{ picsum: 1070 }, { picsum: 111 }, { picsum: 133 }, { picsum: 655 }],
  },
  {
    id: 'pool-flowers',
    keywords: ['flower', 'garden', 'spring', 'bloom', 'tulip', 'floral', 'blossom', 'plant'],
    sources: [{ picsum: 976 }, { picsum: 696 }, { picsum: 360 }, { picsum: 82 }],
  },
  {
    id: 'pool-architecture',
    keywords: ['building', 'architecture', 'tower', 'interior', 'minimal', 'concrete', 'house', 'design'],
    sources: [{ picsum: 1048 }, { picsum: 939 }, { picsum: 942 }, { picsum: 953 }],
  },
  {
    id: 'pool-mountains',
    keywords: ['mountain', 'snow', 'alps', 'peak', 'hike', 'winter', 'glacier', 'landscape'],
    sources: [{ picsum: 906 }, { picsum: 908 }, { picsum: 961 }, { picsum: 1036 }],
  },
  {
    id: 'pool-fallback',
    fallback: true,
    keywords: [],
    sources: [{ picsum: 1015 }, { picsum: 507 }, { picsum: 916 }, { picsum: 873 }],
  },
];
