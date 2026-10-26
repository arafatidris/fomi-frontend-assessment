/**
 * A Direction is a prompt broken into the dimensions a creative director
 * actually reasons about. Each one can be locked, explored or rewritten on its
 * own, which is what makes iteration controllable instead of a re-roll.
 */
export const DIRECTION_FIELDS = [
  { key: 'subject', label: 'Subject', hint: 'What is in the frame' },
  { key: 'setting', label: 'Setting', hint: 'Where it happens' },
  { key: 'light', label: 'Light', hint: 'Quality, direction and time of light' },
  { key: 'camera', label: 'Camera', hint: 'Lens, angle and framing' },
  { key: 'palette', label: 'Palette', hint: 'Dominant colors' },
  { key: 'mood', label: 'Mood', hint: 'How it should feel' },
];

export const FIELD_KEYS = DIRECTION_FIELDS.map((field) => field.key);

const LABELS = Object.fromEntries(DIRECTION_FIELDS.map((field) => [field.key, field.label]));

export function getFieldLabel(key) {
  return LABELS[key] ?? key;
}

/** The exact prompt sent to the model for a direction. */
export function composePrompt(direction) {
  return (
    `Editorial photograph of ${direction.subject}, ${direction.setting}. ` +
    `Lighting: ${direction.light}. Camera: ${direction.camera}. ` +
    `Palette: ${direction.palette}. Mood: ${direction.mood}.`
  );
}

/** Field-level differences between two directions, in field order. */
export function diffDirections(from, to) {
  return FIELD_KEYS.filter((key) => from[key] !== to[key]).map((key) => ({
    field: key,
    from: from[key],
    to: to[key],
  }));
}

/** The full direction a take was rendered with. */
export function resolveTakeDirection(round, take) {
  if (round.axis && take.variant) {
    return { ...round.base, [round.axis]: take.variant };
  }
  return round.base;
}
