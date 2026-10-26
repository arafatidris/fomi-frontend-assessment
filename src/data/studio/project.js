/**
 * The project a returning creator opens in Fomi Studio: a real-world campaign
 * with a shot list (the deliverables) and the rounds of takes rendered so far.
 *
 * Takes are produced by `npm run media:build` from Unsplash-licensed plates
 * (`picsum` ids). Explore rounds are derived from a single plate so that only
 * the explored axis changes: crops stand in for camera moves and color grades
 * for light, palette and mood. That is the behaviour the workspace promises,
 * reproduced deterministically for the demo.
 */

const DAY = 24 * 60;

// The hero master plate: a hiker on the shore of a mirror-still alpine lake.
const LAKE = { picsum: 980, focus: [0.5, 0.52] };
// Flipped so the figure sits on the right third, leaving open sky for copy.
// Focus is in source coordinates (the crop happens before the flip).
const FRAMED = { picsum: 980, flip: true, zoom: 1.35, focus: [0.37, 0.5] };

const HERO_BASE = {
  subject: 'a lone hiker in a dark technical shell jacket, seen from behind',
  setting: 'on the rocky shore of a still alpine lake, peaks mirrored in the water',
  light: 'soft dawn light breaking through high cloud',
  camera: '24mm wide at eye level, horizon on the upper third',
  palette: 'cold slate and moss with a single warm accent',
  mood: 'quiet, solitary, unhurried',
};

const HERO_GOLDEN = { ...HERO_BASE, light: 'first light, low warm gold raking across the water' };
const HERO_FRAMED = { ...HERO_GOLDEN, camera: '35mm, figure on the right third, open sky on the left for copy' };
const HERO_CURRENT = {
  ...HERO_FRAMED,
  light: 'first light diffused through low morning mist',
  palette: 'glacier blue and slate with a single warm accent',
  mood: 'hushed, cold, completely still',
};

const CAMERA_VARIANTS = [
  { variant: 'wide 16mm establishing shot, the whole valley in frame', source: { ...LAKE, zoom: 1, focus: [0.5, 0.5] } },
  { variant: HERO_FRAMED.camera, source: FRAMED },
  { variant: '85mm, close on the figure and its reflection', source: { picsum: 980, flip: true, zoom: 3, focus: [0.17, 0.56] } },
  { variant: 'low and wide from the waterline, reflection filling the frame', source: { ...LAKE, zoom: 1.6, focus: [0.55, 0.76] } },
];

const SHELL = {
  subject: 'a hiker in an ember-orange shell jacket and grey knit beanie, seen from behind',
  setting: 'facing a wall of dense mountain fog',
  light: 'flat, diffused fog light',
  camera: '50mm, tight on the shoulders, centered',
  palette: 'muted greys with an ember-orange hero',
  mood: 'contemplative, enveloped',
};

const PADDLE = {
  subject: 'a paddler in a red shell jacket at the bow of a canoe',
  setting: 'gliding across a glassy turquoise lake below a dark pine shoreline',
  light: 'clear late-afternoon light',
  camera: 'over-the-shoulder 35mm from the stern',
  palette: 'turquoise and pine with a red accent',
  mood: 'calm, adventurous',
};

const NIGHT = {
  subject: 'a lone figure silhouetted on a ridge',
  setting: 'beneath the full arc of the Milky Way',
  light: 'starlight with a faint warm glow on the horizon',
  camera: 'vertical 14mm, figure small in the lower third',
  palette: 'deep navy and violet with an amber horizon',
  mood: 'awe, insignificance',
};

const TREES = {
  subject: 'a hiker in a red jacket, small in the frame',
  setting: 'deep in an old-growth forest, trunks fading into fog',
  light: 'soft, misty forest light',
  camera: '28mm, centered, the trees as a frame',
  palette: 'moss green and fog grey with a red accent',
  mood: 'hushed, mysterious',
};

const ROAD = {
  subject: 'an empty two-lane road with no traffic',
  setting: 'cutting across an open northern valley towards distant peaks',
  light: 'cold, clear morning light',
  camera: 'ultra-wide banner framing with the road vanishing at center',
  palette: 'asphalt grey, snow white and muted gold',
  mood: 'open, inviting, the journey ahead',
};

export const STUDIO_PROJECT = {
  id: 'nordvik-into-the-quiet',
  client: 'Nordvik',
  name: 'Into the Quiet',
  season: 'FW26',
  brief:
    'Key visuals for the FW26 shell jacket launch. Lone figures in vast, quiet northern landscapes: stillness over adrenaline. Warm accents are the only color that shouts, and every frame must still read at 1080px.',
  dueInDays: 9,
  defaultModelId: 'lumen-2',
  shots: [
    {
      id: 'hero',
      title: 'First light',
      use: 'Website hero',
      aspectRatio: '16:9',
      deliverable: '2400 × 1350',
      finalTakeId: null,
      basedOnTakeId: 'hero-r3-2',
      direction: HERO_CURRENT,
      locks: { subject: true, setting: true, camera: true },
      rounds: [
        {
          id: 'hero-r1',
          number: 1,
          kind: 'generate',
          minutesAgo: 2 * DAY + 50,
          base: HERO_BASE,
          changes: [],
          takes: [
            { id: 'hero-r1-1', seed: 3101, rating: 'pick', source: LAKE },
            { id: 'hero-r1-2', seed: 3102, rating: null, source: { picsum: 883, focus: [0.5, 0.45] } },
            { id: 'hero-r1-3', seed: 3103, rating: null, source: { picsum: 1006, focus: [0.5, 0.55] } },
            { id: 'hero-r1-4', seed: 3104, rating: 'reject', source: { picsum: 177, focus: [0.5, 0.55] } },
          ],
        },
        {
          id: 'hero-r2',
          number: 2,
          kind: 'explore',
          axis: 'light',
          minutesAgo: 2 * DAY + 18,
          base: HERO_BASE,
          basedOnTakeId: 'hero-r1-1',
          changes: [],
          takes: [
            { id: 'hero-r2-1', seed: 3101, rating: 'pick', variant: HERO_GOLDEN.light, source: { ...LAKE, grade: ['golden'] } },
            { id: 'hero-r2-2', seed: 3101, rating: null, variant: 'blue hour before sunrise, cold and shadowless', source: { ...LAKE, grade: ['blue-hour'] } },
            { id: 'hero-r2-3', seed: 3101, rating: 'reject', variant: 'flat overcast with low cloud on the peaks', source: { ...LAKE, grade: ['overcast'] } },
            { id: 'hero-r2-4', seed: 3101, rating: null, variant: 'last light, a dusky rose sky', source: { ...LAKE, grade: ['dusk'] } },
          ],
        },
        {
          id: 'hero-r3',
          number: 3,
          kind: 'explore',
          axis: 'camera',
          minutesAgo: DAY + 95,
          base: HERO_GOLDEN,
          basedOnTakeId: 'hero-r2-1',
          changes: [{ field: 'light', from: HERO_BASE.light, to: HERO_GOLDEN.light }],
          takes: CAMERA_VARIANTS.map(({ variant, source }, index) => ({
            id: `hero-r3-${index + 1}`,
            seed: 3101,
            rating: ['reject', 'pick', 'pick', null][index],
            variant,
            source: { ...source, grade: ['golden'] },
          })),
        },
        {
          id: 'hero-r4',
          number: 4,
          kind: 'direct',
          instruction: 'Colder, add morning mist, more stillness',
          minutesAgo: 38,
          base: HERO_CURRENT,
          basedOnTakeId: 'hero-r3-2',
          changes: [
            { field: 'camera', from: HERO_GOLDEN.camera, to: HERO_FRAMED.camera },
            { field: 'light', from: HERO_GOLDEN.light, to: HERO_CURRENT.light },
            { field: 'palette', from: HERO_BASE.palette, to: HERO_CURRENT.palette },
            { field: 'mood', from: HERO_BASE.mood, to: HERO_CURRENT.mood },
          ],
          takes: [
            { id: 'hero-r4-1', seed: 3101, rating: null, source: { ...FRAMED, grade: ['mist'] } },
            { id: 'hero-r4-2', seed: 3401, rating: null, source: { ...FRAMED, zoom: 1.5, focus: [0.34, 0.53], grade: ['mist', 'glacier'] } },
            { id: 'hero-r4-3', seed: 3402, rating: null, source: { ...FRAMED, zoom: 1.25, focus: [0.4, 0.47], grade: ['mist-heavy'] } },
            { id: 'hero-r4-4', seed: 3403, rating: null, source: { ...FRAMED, zoom: 1.42, focus: [0.36, 0.5], grade: ['mist', 'mono'] } },
          ],
        },
      ],
      pools: [
        {
          id: 'hero-pool-light',
          kind: 'explore',
          axis: 'light',
          base: HERO_CURRENT,
          seed: 3101,
          takes: [
            { variant: 'first light, low warm gold raking across the water', source: { ...FRAMED, grade: ['golden'] } },
            { variant: 'blue hour before sunrise, cold and shadowless', source: { ...FRAMED, grade: ['blue-hour'] } },
            { variant: 'flat overcast with low cloud on the peaks', source: { ...FRAMED, grade: ['overcast'] } },
            { variant: 'night, cold moonlight and the first stars', source: { ...FRAMED, grade: ['night'] } },
          ],
        },
        {
          id: 'hero-pool-camera',
          kind: 'explore',
          axis: 'camera',
          base: HERO_CURRENT,
          seed: 3101,
          takes: CAMERA_VARIANTS.map(({ variant, source }) => ({ variant, source: { ...source, grade: ['mist'] } })),
        },
        {
          id: 'hero-pool-palette',
          kind: 'explore',
          axis: 'palette',
          base: HERO_CURRENT,
          seed: 3101,
          takes: [
            { variant: 'glacier teal and slate', source: { ...FRAMED, grade: ['mist', 'glacier'] } },
            { variant: 'ember orange against muted earth', source: { ...FRAMED, grade: ['ember'] } },
            { variant: 'monochrome silver', source: { ...FRAMED, grade: ['mono'] } },
            { variant: 'faded film, warm highlights', source: { ...FRAMED, grade: ['film'] } },
          ],
        },
        {
          id: 'hero-pool-mood',
          kind: 'explore',
          axis: 'mood',
          base: HERO_CURRENT,
          seed: 3101,
          takes: [
            { variant: 'airy and hopeful', source: { ...FRAMED, grade: ['airy'] } },
            { variant: 'brooding, a storm coming in', source: { ...FRAMED, grade: ['brooding'] } },
            { variant: 'nostalgic, like a film still', source: { ...FRAMED, grade: ['film', 'nostalgic'] } },
            { variant: 'serene, minimal, almost silent', source: { ...FRAMED, grade: ['mist-heavy', 'serene'] } },
          ],
        },
        {
          id: 'hero-pool-generate',
          kind: 'generate',
          base: HERO_CURRENT,
          takes: [
            { seed: 3501, source: { picsum: 883, focus: [0.5, 0.45], grade: ['mist'] } },
            { seed: 3502, source: { picsum: 1006, focus: [0.55, 0.55], grade: ['mist', 'glacier'] } },
            { seed: 3503, source: { picsum: 447, focus: [0.5, 0.5], grade: ['mist-heavy'] } },
            { seed: 3504, source: { picsum: 177, focus: [0.5, 0.55], grade: ['mist', 'mono'] } },
          ],
        },
      ],
    },
    {
      id: 'shell',
      title: 'The shell',
      use: 'Instagram feed',
      aspectRatio: '4:5',
      deliverable: '1080 × 1350',
      finalTakeId: 'shell-r1-1',
      basedOnTakeId: null,
      direction: SHELL,
      locks: { subject: true },
      rounds: [
        {
          id: 'shell-r1',
          number: 1,
          kind: 'generate',
          minutesAgo: 5 * DAY + 120,
          base: SHELL,
          changes: [],
          takes: [
            { id: 'shell-r1-1', seed: 6101, rating: 'pick', source: { picsum: 669, focus: [0.5, 0.5] } },
            { id: 'shell-r1-2', seed: 6102, rating: 'pick', source: { picsum: 473, focus: [0.42, 0.5] } },
            { id: 'shell-r1-3', seed: 6103, rating: 'reject', source: { picsum: 1005, focus: [0.66, 0.5] } },
          ],
        },
      ],
      pools: [],
    },
    {
      id: 'paddle',
      title: 'Paddle out',
      use: 'Instagram feed',
      aspectRatio: '4:5',
      deliverable: '1080 × 1350',
      finalTakeId: 'paddle-r1-1',
      basedOnTakeId: null,
      direction: PADDLE,
      locks: { subject: true, camera: true },
      rounds: [
        {
          id: 'paddle-r1',
          number: 1,
          kind: 'generate',
          minutesAgo: 4 * DAY + 300,
          base: PADDLE,
          changes: [],
          takes: [
            { id: 'paddle-r1-1', seed: 6201, rating: 'pick', source: { picsum: 1011, focus: [0.6, 0.5] } },
            { id: 'paddle-r1-2', seed: 6202, rating: 'pick', source: { picsum: 469, focus: [0.36, 0.5] } },
            { id: 'paddle-r1-3', seed: 6203, rating: null, source: { picsum: 434, focus: [0.5, 0.5] } },
          ],
        },
      ],
      pools: [],
    },
    {
      id: 'night',
      title: 'Night watch',
      use: 'Instagram story',
      aspectRatio: '9:16',
      deliverable: '1080 × 1920',
      finalTakeId: null,
      basedOnTakeId: null,
      direction: NIGHT,
      locks: { subject: true },
      rounds: [
        {
          id: 'night-r1',
          number: 1,
          kind: 'generate',
          minutesAgo: DAY + 30,
          base: NIGHT,
          changes: [],
          takes: [
            { id: 'night-r1-1', seed: 6301, rating: 'pick', source: { picsum: 903, focus: [0.49, 0.5] } },
            { id: 'night-r1-2', seed: 6302, rating: 'pick', source: { picsum: 974, focus: [0.47, 0.5] } },
            { id: 'night-r1-3', seed: 6303, rating: null, source: { picsum: 537, focus: [0.5, 0.5] } },
            { id: 'night-r1-4', seed: 6304, rating: 'reject', source: { picsum: 683, focus: [0.62, 0.5] } },
          ],
        },
      ],
      pools: [
        {
          id: 'night-pool-generate',
          kind: 'generate',
          base: NIGHT,
          takes: [
            { seed: 6311, source: { picsum: 870, focus: [0.5, 0.5] } },
            { seed: 6312, source: { picsum: 903, zoom: 1.3, focus: [0.49, 0.62], grade: ['blue-hour'] } },
            { seed: 6313, source: { picsum: 974, zoom: 1.2, focus: [0.47, 0.55], grade: ['golden'] } },
            { seed: 6314, source: { picsum: 537, zoom: 1.15, focus: [0.5, 0.6] } },
          ],
        },
      ],
    },
    {
      id: 'trees',
      title: 'Into the trees',
      use: 'Product page',
      aspectRatio: '1:1',
      deliverable: '2000 × 2000',
      finalTakeId: null,
      basedOnTakeId: null,
      direction: TREES,
      locks: {},
      rounds: [
        {
          id: 'trees-r1',
          number: 1,
          kind: 'generate',
          minutesAgo: 6 * 60 + 15,
          base: TREES,
          changes: [],
          takes: [
            { id: 'trees-r1-1', seed: 6401, rating: null, source: { picsum: 543, focus: [0.55, 0.5] } },
            { id: 'trees-r1-2', seed: 6402, rating: null, source: { picsum: 1044, focus: [0.5, 0.5] } },
            { id: 'trees-r1-3', seed: 6403, rating: null, source: { picsum: 877, focus: [0.5, 0.5] } },
            { id: 'trees-r1-4', seed: 6404, rating: null, source: { picsum: 919, focus: [0.5, 0.5] } },
          ],
        },
      ],
      pools: [
        {
          id: 'trees-pool-generate',
          kind: 'generate',
          base: TREES,
          takes: [
            { seed: 6411, source: { picsum: 543, zoom: 1.45, focus: [0.56, 0.62] } },
            { seed: 6412, source: { picsum: 877, zoom: 1.2, focus: [0.45, 0.5], grade: ['mist'] } },
            { seed: 6413, source: { picsum: 1044, zoom: 1.6, focus: [0.5, 0.75] } },
            { seed: 6414, source: { picsum: 919, zoom: 1.1, focus: [0.5, 0.5], grade: ['mist-heavy'] } },
          ],
        },
      ],
    },
    {
      id: 'road',
      title: 'The long road',
      use: 'Email header',
      aspectRatio: '21:9',
      deliverable: '1200 × 514',
      finalTakeId: null,
      basedOnTakeId: null,
      direction: ROAD,
      locks: {},
      rounds: [],
      pools: [
        {
          id: 'road-pool-generate',
          kind: 'generate',
          base: ROAD,
          takes: [
            { seed: 6501, source: { picsum: 563, focus: [0.5, 0.58] } },
            { seed: 6502, source: { picsum: 964, focus: [0.5, 0.55] } },
            { seed: 6503, source: { picsum: 767, focus: [0.5, 0.62] } },
            { seed: 6504, source: { picsum: 563, focus: [0.5, 0.6], grade: ['golden'] } },
          ],
        },
      ],
    },
  ],
};
