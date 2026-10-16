/** Caps WebGL resolution. Phones stay at 1x so a frame can finish. */
export function cappedPixelRatio() {
  const dpr = window.devicePixelRatio || 1;
  const mobile = window.matchMedia("(max-width: 800px)").matches;
  return Math.min(dpr, mobile ? 1 : 1.5);
}

export function mobileViewport() {
  return window.matchMedia("(max-width: 800px)").matches;
}
