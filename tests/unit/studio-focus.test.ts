import { describe, expect, it } from "vitest";
import { wrapFocus } from "@/studio/focus";

describe("wrapFocus", () => {
  const items = ["close", "alt", "prev", "save", "next"];

  it("wraps Tab from the last element to the first, and Shift+Tab from the first to the last", () => {
    expect(wrapFocus(items, "next", false)).toBe("close");
    expect(wrapFocus(items, "close", true)).toBe("next");
  });

  it("pulls focus back in when it is outside the dialog", () => {
    expect(wrapFocus(items, "somewhere-else", false)).toBe("close");
    expect(wrapFocus(items, null, true)).toBe("next");
  });

  it("leaves normal Tab movement inside the dialog alone", () => {
    expect(wrapFocus(items, "alt", false)).toBeNull();
    expect(wrapFocus(items, "save", true)).toBeNull();
    expect(wrapFocus([], "x", false)).toBeNull();
  });
});
