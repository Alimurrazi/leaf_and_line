export type BookProgress = { chapterSlug: string; page: number; updatedAt: string };
export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function progressKey(bookSlug: string): string {
  return `leaf-and-line:progress:v1:${bookSlug}`;
}

export function getBrowserStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // access itself can throw when storage is blocked
  }
}

function isBookProgress(value: unknown): value is BookProgress {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.chapterSlug === "string" &&
    typeof record.page === "number" &&
    Number.isInteger(record.page) &&
    record.page >= 1 &&
    typeof record.updatedAt === "string"
  );
}

export function readRawProgress(bookSlug: string, storage: StorageLike | null = getBrowserStorage()): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(progressKey(bookSlug));
  } catch {
    return null;
  }
}

export function parseProgress(raw: string | null): BookProgress | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isBookProgress(value) ? value : null;
  } catch {
    return null;
  }
}

export function readProgress(bookSlug: string, storage: StorageLike | null = getBrowserStorage()): BookProgress | null {
  return parseProgress(readRawProgress(bookSlug, storage));
}

export function writeProgress(
  bookSlug: string,
  progress: { chapterSlug: string; page: number },
  storage: StorageLike | null = getBrowserStorage(),
  now: Date = new Date(),
): void {
  if (!storage) return;
  try {
    const value: BookProgress = { ...progress, updatedAt: now.toISOString() };
    storage.setItem(progressKey(bookSlug), JSON.stringify(value));
  } catch {
    // Storage full or blocked: progress is best-effort.
  }
}
