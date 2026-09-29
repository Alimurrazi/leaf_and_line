export type KeyAction = "next" | "previous" | null;

type KeyInfo = { key: string; altKey: boolean; ctrlKey: boolean; metaKey: boolean };

function isEditable(target: unknown): boolean {
  if (!target || typeof target !== "object") return false;
  const el = target as { tagName?: unknown; isContentEditable?: unknown };
  if (el.isContentEditable === true) return true;
  return typeof el.tagName === "string" && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

export function keyToAction(event: KeyInfo, target: unknown): KeyAction {
  if (event.altKey || event.ctrlKey || event.metaKey) return null;
  if (isEditable(target)) return null;
  if (event.key === "ArrowRight" || event.key === "PageDown") return "next";
  if (event.key === "ArrowLeft" || event.key === "PageUp") return "previous";
  return null;
}
