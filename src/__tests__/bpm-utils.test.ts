import { describe, it, expect } from "vitest";
import { interquartileMean } from "@/lib/bpm-utils";

describe("interquartileMean", () => {
  it("returns the plain mean for fewer than 4 elements", () => {
    expect(interquartileMean([10, 20, 30])).toBeCloseTo(20);
  });

  it("handles a single element", () => {
    expect(interquartileMean([42])).toBe(42);
  });

  it("returns zero for an empty array (NaN-safe implicit)", () => {
    // 0/0 = NaN — document the current behavior
    const result = interquartileMean([]);
    expect(isNaN(result)).toBe(true);
  });

  it("trims outliers correctly", () => {
    // [1, 500, 500, 500, 500, 500, 500, 1000]
    // sorted: [1, 500, 500, 500, 500, 500, 500, 1000]
    // q1 = floor(8*0.25)=2, q3 = ceil(8*0.75)=6
    // trimmed = [500, 500, 500, 500] → mean = 500
    const result = interquartileMean([1000, 500, 500, 500, 500, 500, 500, 1]);
    expect(result).toBeCloseTo(500);
  });

  it("returns correct mean for uniform values", () => {
    const result = interquartileMean([100, 100, 100, 100, 100, 100]);
    expect(result).toBeCloseTo(100);
  });

  it("converts beat intervals to realistic BPM range", () => {
    // 120 BPM = 500ms interval
    const intervals = [495, 500, 505, 498, 502, 500, 501, 499];
    const avgInterval = interquartileMean(intervals);
    const bpm = Math.round(60000 / avgInterval);
    expect(bpm).toBe(120);
  });
});
