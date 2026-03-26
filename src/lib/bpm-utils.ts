/**
 * Computes the interquartile mean: removes the bottom and top 25% of values,
 * then returns the mean of the remaining middle 50%.
 * Falls back to a plain mean if fewer than 4 values are provided.
 */
export function interquartileMean(arr: number[]): number {
  if (arr.length < 4) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  const sorted = [...arr].sort((a, b) => a - b);
  const q1 = Math.floor(sorted.length * 0.25);
  const q3 = Math.ceil(sorted.length * 0.75);
  const trimmed = sorted.slice(q1, q3);
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}
