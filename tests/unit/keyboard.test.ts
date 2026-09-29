import { describe, expect, it } from "vitest";
import { keyToAction } from "@/features/reader/keyboard";

const key = (k: string, mods: Partial<{ altKey: boolean; ctrlKey: boolean; metaKey: boolean }> = {}) => ({
  key: k,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  ...mods,
});
const body = { tagName: "BODY", isContentEditable: false };

describe("keyToAction", () => {
  it("maps arrows and page keys", () => {
    expect(keyToAction(key("ArrowRight"), body)).toBe("next");
    expect(keyToAction(key("PageDown"), body)).toBe("next");
    expect(keyToAction(key("ArrowLeft"), body)).toBe("previous");
    expect(keyToAction(key("PageUp"), body)).toBe("previous");
    expect(keyToAction(key("a"), body)).toBeNull();
  });

  it("ignores keys typed into editable fields", () => {
    for (const tagName of ["INPUT", "TEXTAREA", "SELECT"]) {
      expect(keyToAction(key("ArrowRight"), { tagName, isContentEditable: false })).toBeNull();
    }
    expect(keyToAction(key("ArrowLeft"), { tagName: "DIV", isContentEditable: true })).toBeNull();
  });

  it("ignores browser shortcuts with modifiers", () => {
    expect(keyToAction(key("ArrowLeft", { altKey: true }), body)).toBeNull();
    expect(keyToAction(key("ArrowRight", { ctrlKey: true }), body)).toBeNull();
    expect(keyToAction(key("ArrowRight", { metaKey: true }), body)).toBeNull();
  });

  it("handles a null target", () => {
    expect(keyToAction(key("ArrowRight"), null)).toBe("next");
  });
});
