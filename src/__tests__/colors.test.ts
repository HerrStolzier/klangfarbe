import { describe, it, expect } from "vitest";
import { colorSchemes, getHue, type ColorScheme } from "@/lib/visualizers/colors";

describe("colorSchemes data structure", () => {
  it("has at least one scheme", () => {
    expect(colorSchemes.length).toBeGreaterThan(0);
  });

  it("every scheme has required fields", () => {
    for (const scheme of colorSchemes) {
      expect(typeof scheme.name).toBe("string");
      expect(scheme.name.length).toBeGreaterThan(0);
      expect(typeof scheme.coolHue).toBe("function");
      expect(typeof scheme.hotHue).toBe("function");
      expect(typeof scheme.threshold).toBe("number");
      expect(typeof scheme.saturation).toBe("number");
    }
  });

  it("threshold is between 0 and 1", () => {
    for (const scheme of colorSchemes) {
      expect(scheme.threshold).toBeGreaterThanOrEqual(0);
      expect(scheme.threshold).toBeLessThanOrEqual(1);
    }
  });

  it("saturation is between 0 and 100", () => {
    for (const scheme of colorSchemes) {
      expect(scheme.saturation).toBeGreaterThanOrEqual(0);
      expect(scheme.saturation).toBeLessThanOrEqual(100);
    }
  });

  it("coolHue and hotHue return numbers", () => {
    for (const scheme of colorSchemes) {
      expect(typeof scheme.coolHue(0)).toBe("number");
      expect(typeof scheme.coolHue(1)).toBe("number");
      expect(typeof scheme.hotHue(0)).toBe("number");
      expect(typeof scheme.hotHue(1)).toBe("number");
    }
  });
});

describe("getHue", () => {
  const neon = colorSchemes.find((s) => s.name === "Neon") as ColorScheme;

  it("returns cool hue below threshold", () => {
    const energy = { low: 0, mid: 0, high: 0 }; // intensity = 0
    const result = getHue(neon, energy, 0.5);
    const expectedHue = neon.coolHue(0.5);
    expect(result.hue).toBe(expectedHue);
    expect(result.saturation).toBe(neon.saturation);
  });

  it("returns hot hue above threshold", () => {
    const energy = { low: 1, mid: 1, high: 1 }; // intensity = 1
    const result = getHue(neon, energy, 0.5);
    const expectedHue = neon.hotHue(0.5);
    expect(result.hue).toBe(expectedHue);
    expect(result.saturation).toBe(neon.saturation);
  });

  it("returns saturation matching scheme", () => {
    const energy = { low: 0.3, mid: 0.3, high: 0.3 };
    for (const scheme of colorSchemes) {
      const result = getHue(scheme, energy, 0);
      expect(result.saturation).toBe(scheme.saturation);
    }
  });

  it("Mono scheme always returns hue 0", () => {
    const mono = colorSchemes.find((s) => s.name === "Mono") as ColorScheme;
    expect(getHue(mono, { low: 0, mid: 0, high: 0 }, 0.5).hue).toBe(0);
    expect(getHue(mono, { low: 1, mid: 1, high: 1 }, 0.5).hue).toBe(0);
  });
});
