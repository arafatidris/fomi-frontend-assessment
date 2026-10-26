/** Models offered in the Create workspace, grouped by the media they produce. */
export const MODELS = [
  { id: 'fomi-lumen-2', type: 'image', name: 'Lumen 2', description: 'Balanced quality and speed. The everyday default.', speed: 'Fast' },
  { id: 'fomi-portrait', type: 'image', name: 'Portrait Pro', description: 'Lifelike skin tones, eyes and hair.', speed: 'Standard' },
  { id: 'fomi-realism', type: 'image', name: 'Realism XL', description: 'Photographic detail and texture.', speed: 'Detailed' },
  { id: 'fomi-draft', type: 'image', name: 'Draft Turbo', description: 'Quick ideas in about two seconds.', speed: 'Instant' },
  { id: 'fomi-motion-2', type: 'video', name: 'Motion 2', description: 'Smooth, cinematic camera movement.', speed: 'Standard' },
  { id: 'fomi-motion-fast', type: 'video', name: 'Motion Turbo', description: 'Fast 720p previews for iteration.', speed: 'Fast' },
];

export const DEFAULT_MODEL = { image: 'fomi-lumen-2', video: 'fomi-motion-2' };

const BY_ID = new Map(MODELS.map((model) => [model.id, model]));

export function getModel(id) {
  return BY_ID.get(id) ?? null;
}

export function getModelsFor(type) {
  return MODELS.filter((model) => model.type === type);
}
