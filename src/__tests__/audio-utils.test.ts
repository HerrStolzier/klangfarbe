import { describe, it, expect } from "vitest";
import { computeEnergy } from "@/lib/audio-utils";

// FFT_SIZE = 2048, sample rate 44100 Hz
// lowEnd = floor(250 / (44100/2048)) = floor(250 / 21.53) = 11 bins
// midEnd = floor(4000 / (44100/2048)) = floor(4000 / 21.53) = 185 bins
const BIN_COUNT = 1024; // frequencyBinCount = fftSize / 2

describe("computeEnergy", () => {
  it("returns zeros for an all-zero array", () => {
    const frequency = new Uint8Array(BIN_COUNT).fill(0);
    const result = computeEnergy(frequency);
    expect(result.low).toBe(0);
    expect(result.mid).toBe(0);
    expect(result.high).toBe(0);
  });

  it("returns values near 1 for an all-max array", () => {
    const frequency = new Uint8Array(BIN_COUNT).fill(255);
    const result = computeEnergy(frequency);
    expect(result.low).toBeCloseTo(1, 5);
    expect(result.mid).toBeCloseTo(1, 5);
    expect(result.high).toBeCloseTo(1, 5);
  });

  it("returns high low energy and low mid/high for low-frequency-only bins", () => {
    // lowEnd = floor(250 / (44100/2048)) ≈ 11
    const frequency = new Uint8Array(BIN_COUNT).fill(0);
    // Fill only the first 11 bins (low band) with max value
    for (let i = 0; i < 11; i++) {
      frequency[i] = 255;
    }
    const result = computeEnergy(frequency);
    expect(result.low).toBeCloseTo(1, 5);
    expect(result.mid).toBe(0);
    expect(result.high).toBe(0);
  });

  it("returns values between 0 and 1 for partial data", () => {
    const frequency = new Uint8Array(BIN_COUNT).fill(128);
    const result = computeEnergy(frequency);
    expect(result.low).toBeGreaterThan(0);
    expect(result.low).toBeLessThan(1);
    expect(result.mid).toBeGreaterThan(0);
    expect(result.mid).toBeLessThan(1);
    expect(result.high).toBeGreaterThan(0);
    expect(result.high).toBeLessThan(1);
  });
});
