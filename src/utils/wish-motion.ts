export const WISH_STAR_FLIGHT_MS = 800;
export const WISH_STAR_SPIN_MS = 3600;
export const WISH_STAR_TRAIL_MS = 1100;

async function play(element: HTMLElement, frames: Keyframe[], options: KeyframeAnimationOptions, signal: AbortSignal, id: string) {
  if (signal.aborted) return;
  const animation = element.animate(frames, options);
  animation.id = id;
  const cancel = () => animation.cancel();
  signal.addEventListener('abort', cancel, { once: true });
  try { await animation.finished; }
  catch (error) { if (!signal.aborted) throw error; }
  finally { signal.removeEventListener('abort', cancel); animation.cancel(); }
}

/** Move only the main original SVG; keep the resting layout and trail independent. */
export async function animateWishStar(outer: HTMLElement, star: HTMLElement, trail: HTMLElement, signal: AbortSignal, onLanded: () => void): Promise<void> {
  if (signal.aborted || matchMedia('(prefers-reduced-motion: reduce)').matches) { onLanded(); return; }
  const rect = outer.getBoundingClientRect();
  const panel = outer.closest('.wish-panel')?.getBoundingClientRect() ?? rect;
  const startX = panel.right - 24 - (rect.left + rect.width / 2);
  const startY = panel.top + 24 - (rect.top + rect.height / 2);
  await play(outer, [
    { offset: 0, transform: `translate(${startX}px, ${startY}px)`, opacity: 0 },
    { offset: .08, opacity: 1 },
    { offset: 1, transform: 'translate(0, 0)', opacity: 1 },
  ], { duration: WISH_STAR_FLIGHT_MS, easing: 'cubic-bezier(.22,.65,.3,1)', fill: 'both' }, signal, 'wish-star-flight');
  if (signal.aborted) return;
  onLanded();
  await Promise.all([play(star, [
    { transform: 'rotate(0deg)', offset: 0 },
    { transform: 'rotate(360deg)', offset: 1 },
  ], { duration: WISH_STAR_SPIN_MS, easing: 'ease-in-out', fill: 'both' }, signal, 'wish-star-spin'),
  play(trail, [
    { clipPath: 'inset(0 100% 0 0)', transform: 'translate(-12px, 12px)', opacity: 0 },
    { clipPath: 'inset(0 0% 0 0)', transform: 'translate(0, 0)', opacity: 1 },
  ], { duration: WISH_STAR_TRAIL_MS, easing: 'cubic-bezier(.22,.65,.3,1)', fill: 'both' }, signal, 'wish-star-trail')]);
}
