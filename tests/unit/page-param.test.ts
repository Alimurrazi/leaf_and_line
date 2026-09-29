import { describe, expect, it } from "vitest";
import { parsePageParam } from "@/features/reader/page-param";

describe("parsePageParam", () => {
  it("defaults a missing page to 1 without rewriting the URL", () => {
    expect(parsePageParam(null, 14)).toEqual({ page: 1, canonical: true });
    expect(parsePageParam(undefined, 14)).toEqual({ page: 1, canonical: true });
    expect(parsePageParam("", 14)).toEqual({ page: 1, canonical: true });
  });

  it("accepts valid 1-based pages", () => {
    expect(parsePageParam("1", 14)).toEqual({ page: 1, canonical: true });
    expect(parsePageParam("14", 14)).toEqual({ page: 14, canonical: true });
  });

  it("clamps out-of-range numbers and marks them for correction", () => {
    expect(parsePageParam("0", 14)).toEqual({ page: 1, canonical: false });
    expect(parsePageParam("99", 14)).toEqual({ page: 14, canonical: false });
  });

  it("treats non-numbers, negatives and decimals as page 1, marked for correction", () => {
    expect(parsePageParam("abc", 14)).toEqual({ page: 1, canonical: false });
    expect(parsePageParam("-3", 14)).toEqual({ page: 1, canonical: false });
    expect(parsePageParam("2.5", 14)).toEqual({ page: 1, canonical: false });
  });

  it("normalizes leading zeros", () => {
    expect(parsePageParam("03", 14)).toEqual({ page: 3, canonical: false });
  });
});
