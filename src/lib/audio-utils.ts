const FFT_SIZE = 2048;

/**
 * Compute normalized energy levels (0-1) for low, mid, and high frequency bands.
 * Assumes a standard 44100 Hz sample rate.
 */
export function computeEnergy(frequency: Uint8Array): {
  low: number;
  mid: number;
  high: number;
} {
  const binCount = frequency.length;
  const lowEnd = Math.floor(250 / (44100 / FFT_SIZE));
  const midEnd = Math.floor(4000 / (44100 / FFT_SIZE));

  let low = 0;
  let mid = 0;
  let high = 0;

  for (let i = 0; i < binCount; i++) {
    if (i < lowEnd) low += frequency[i];
    else if (i < midEnd) mid += frequency[i];
    else high += frequency[i];
  }

  low = low / (lowEnd * 255);
  mid = mid / ((midEnd - lowEnd) * 255);
  high = high / ((binCount - midEnd) * 255);

  return { low, mid, high };
}
