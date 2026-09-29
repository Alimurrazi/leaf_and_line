export type Point = { x: number; y: number };
export type SwipeDirection = "left" | "right";

export const SWIPE_MIN_DISTANCE = 60;

/** Returns a direction only for a clear horizontal swipe on an un-zoomed page. */
export function detectSwipe(start: Point, end: Point, scale: number): SwipeDirection | null {
  if (scale > 1.01) return null; // panning a zoomed page must never turn it
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return null;
  if (Math.abs(dx) <= Math.abs(dy) * 1.5) return null;
  return dx < 0 ? "left" : "right";
}
