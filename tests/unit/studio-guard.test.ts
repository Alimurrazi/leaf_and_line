import { afterEach, describe, expect, it, vi } from "vitest";
import { assertStudio, studioEnabled } from "@/studio/guard";

afterEach(() => vi.unstubAllEnvs());

describe("studio guard", () => {
  it("is on only under the dev server", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(studioEnabled()).toBe(true);
    expect(() => assertStudio()).not.toThrow();
  });

  it("is off in production and test builds", () => {
    for (const env of ["production", "test"]) {
      vi.stubEnv("NODE_ENV", env);
      expect(studioEnabled()).toBe(false);
      expect(() => assertStudio()).toThrow(/only runs under `npm run dev`/);
    }
  });
});

describe("dev server binding", () => {
  it("serves `npm run dev` (and so the studio) on localhost only, not the local network", async () => {
    const { readFileSync } = await import("node:fs");
    const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts as Record<string, string>;
    expect(scripts.dev).toMatch(/next dev .*-H (localhost|127\.0\.0\.1)\b/);
  });
});

describe("node version", () => {
  it("declares the Node version that can run the TypeScript index generator directly", async () => {
    const { readFileSync } = await import("node:fs");
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.engines?.node).toBe(">=22.18");
    expect(readFileSync(".nvmrc", "utf8").trim()).toBe("24");
  });
});
