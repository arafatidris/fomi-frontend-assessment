const MARGIN = 8;

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Positions a fixed floating element next to an anchor, flipping to the other
 * side when it would overflow and clamping it inside the viewport.
 * placement: "bottom-start" | "bottom-end" | "bottom-center" | "top-*" | "right-start" | "left-start".
 */
export function placeFloating(anchor, floating, { placement = 'bottom-start', offset = 8, matchWidth = false } = {}) {
  const rect = anchor.getBoundingClientRect();
  if (matchWidth) floating.style.minWidth = `${rect.width}px`;
  floating.style.maxHeight = '';

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const size = floating.getBoundingClientRect();
  let [side, align = 'start'] = placement.split('-');

  if (side === 'bottom' && rect.bottom + offset + size.height > viewportHeight - MARGIN && rect.top > viewportHeight - rect.bottom) side = 'top';
  else if (side === 'top' && rect.top - offset - size.height < MARGIN && viewportHeight - rect.bottom > rect.top) side = 'bottom';
  if (side === 'right' && rect.right + offset + size.width > viewportWidth - MARGIN) side = 'left';
  else if (side === 'left' && rect.left - offset - size.width < MARGIN) side = 'right';

  let top;
  let left;
  if (side === 'bottom' || side === 'top') {
    top = side === 'bottom' ? rect.bottom + offset : rect.top - offset - size.height;
    left = align === 'end' ? rect.right - size.width : align === 'center' ? rect.left + rect.width / 2 - size.width / 2 : rect.left;
    const available = side === 'bottom' ? viewportHeight - top - MARGIN : rect.top - offset - MARGIN;
    if (size.height > available) {
      floating.style.maxHeight = `${Math.max(160, available)}px`;
      if (side === 'top') top = rect.top - offset - Math.max(160, available);
    }
  } else {
    left = side === 'right' ? rect.right + offset : rect.left - offset - size.width;
    top = align === 'end' ? rect.bottom - size.height : rect.top;
  }

  floating.style.left = `${clamp(left, MARGIN, viewportWidth - MARGIN - size.width)}px`;
  floating.style.top = `${clamp(top, MARGIN, viewportHeight - MARGIN - Math.min(size.height, viewportHeight - 2 * MARGIN))}px`;
  floating.dataset.side = side;
}
