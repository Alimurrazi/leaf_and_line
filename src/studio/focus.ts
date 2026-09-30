/**
 * Focus trap for a modal: returns the element to move focus to when Tab would leave the dialog,
 * or null to let the browser move focus normally.
 */
export function wrapFocus<T>(focusables: T[], active: T | null, backwards: boolean): T | null {
  if (focusables.length === 0) return null;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const inside = active !== null && focusables.includes(active);
  if (!inside) return backwards ? last : first;
  if (backwards && active === first) return last;
  if (!backwards && active === last) return first;
  return null;
}
