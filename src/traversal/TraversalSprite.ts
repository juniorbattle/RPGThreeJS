import boundsJson from './TraversalSpriteBounds.json';

interface Bounds { width: number; height: number; left: number; top: number; right: number; bottom: number }
const bounds = boundsJson as Record<string, Bounds>;

/** Fit visible pixels, not the differently padded canonical canvases. Sources remain untouched. */
export function createTraversalSprite(src: string, className: string, mirrorX = false): HTMLElement {
  const box = bounds[src];
  if (!box) throw new Error(`Missing Traversal visible bounds for ${src}`);
  const width = box.right - box.left;
  const height = box.bottom - box.top;
  const wrapper = document.createElement('span');
  wrapper.className = `traversal-sprite ${className}`;
  wrapper.style.aspectRatio = `${width} / ${height}`;
  wrapper.classList.toggle('is-mirrored', mirrorX);
  const image = document.createElement('img');
  image.src = src;
  image.alt = '';
  image.style.width = `${box.width / width * 100}%`;
  image.style.height = `${box.height / height * 100}%`;
  image.style.left = `${-box.left / width * 100}%`;
  image.style.top = `${-box.top / height * 100}%`;
  wrapper.append(image);
  return wrapper;
}
