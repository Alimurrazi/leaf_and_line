import { describe, expect, it } from "vitest";
import { detectSwipe } from "@/features/reader/swipe";

const at = (x: number, y = 100) => ({ x, y });

describe("detectSwipe", () => {
  it("detects a horizontal swipe in either direction", () => {
    expect(detectSwipe(at(300), at(200), 1)).toBe("left");
    expect(detectSwipe(at(200), at(300), 1)).toBe("right");
  });

  it("ignores short movements and taps", () => {
    expect(detectSwipe(at(200), at(150), 1)).toBeNull();
    expect(detectSwipe(at(200), at(200), 1)).toBeNull();
  });

  it("ignores mostly vertical gestures", () => {
    expect(detectSwipe({ x: 200, y: 100 }, { x: 120, y: 260 }, 1)).toBeNull();
  });

  it("never turns the page while zoomed in", () => {
    expect(detectSwipe(at(400), at(100), 1.5)).toBeNull();
    expect(detectSwipe(at(400), at(100), 1.02)).toBeNull();
  });
});
