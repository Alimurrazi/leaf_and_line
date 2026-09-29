import { describe, expect, it } from "vitest";
import {
  parseProgress,
  progressKey,
  readProgress,
  writeProgress,
  type StorageLike,
} from "@/features/reading-progress/progress-store";

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

describe("progress store", () => {
  it("uses a versioned key per book", () => {
    expect(progressKey("wakasamaru")).toBe("leaf-and-line:progress:v1:wakasamaru");
  });

  it("round-trips progress with a timestamp", () => {
    const storage = memoryStorage();
    writeProgress("wakasamaru", { chapterSlug: "chapter-01", page: 8 }, storage, new Date("2026-09-29T10:00:00Z"));
    expect(readProgress("wakasamaru", storage)).toEqual({
      chapterSlug: "chapter-01",
      page: 8,
      updatedAt: "2026-09-29T10:00:00.000Z",
    });
  });

  it("returns null when nothing is saved or storage is unavailable", () => {
    expect(readProgress("wakasamaru", memoryStorage())).toBeNull();
    expect(readProgress("wakasamaru", null)).toBeNull();
  });

  it("never throws when storage throws", () => {
    expect(readProgress("wakasamaru", throwingStorage)).toBeNull();
    expect(() => writeProgress("wakasamaru", { chapterSlug: "chapter-01", page: 2 }, throwingStorage)).not.toThrow();
  });

  it("rejects corrupt or wrongly shaped data", () => {
    expect(parseProgress("{not json")).toBeNull();
    expect(parseProgress("null")).toBeNull();
    expect(parseProgress(JSON.stringify({ chapterSlug: "chapter-01", page: "8", updatedAt: "x" }))).toBeNull();
    expect(parseProgress(JSON.stringify({ chapterSlug: "chapter-01", page: 0, updatedAt: "x" }))).toBeNull();
    expect(parseProgress(JSON.stringify({ chapterSlug: "chapter-01", page: 2.5, updatedAt: "x" }))).toBeNull();
    expect(parseProgress(JSON.stringify({ page: 3, updatedAt: "x" }))).toBeNull();
  });
});
