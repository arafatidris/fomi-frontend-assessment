/**
 * Supported output aspect ratios.
 *
 * `render` is the pixel size used when the demo media was rendered (multiples
 * of 16, ~1MP). The UI only relies on `value`, which is width / height.
 */
export const ASPECT_RATIOS = [
  { id: '1:1', label: 'Square', value: 1, render: [1024, 1024] },
  { id: '4:5', label: 'Portrait', value: 4 / 5, render: [816, 1024] },
  { id: '3:4', label: 'Classic portrait', value: 3 / 4, render: [768, 1024] },
  { id: '2:3', label: 'Photo portrait', value: 2 / 3, render: [704, 1056] },
  { id: '9:16', label: 'Story', value: 9 / 16, render: [720, 1280] },
  { id: '4:3', label: 'Classic', value: 4 / 3, render: [1024, 768] },
  { id: '3:2', label: 'Photo', value: 3 / 2, render: [1056, 704] },
  { id: '16:9', label: 'Widescreen', value: 16 / 9, render: [1280, 720] },
  { id: '21:9', label: 'Cinema', value: 21 / 9, render: [1344, 576] },
];

const BY_ID = new Map(ASPECT_RATIOS.map((ratio) => [ratio.id, ratio]));

export function getAspectRatio(id) {
  return BY_ID.get(id) ?? BY_ID.get('1:1');
}
