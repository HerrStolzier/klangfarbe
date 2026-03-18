export interface ColorScheme {
  name: string;
  /** Returns hue for cool/normal energy (0-360) */
  coolHue: (position: number) => number;
  /** Returns hue for high energy (0-360) */
  hotHue: (position: number) => number;
  /** Energy threshold to switch from cool to hot */
  threshold: number;
  /** Base saturation (0-100) */
  saturation: number;
}

export const colorSchemes: ColorScheme[] = [
  {
    name: "Neon",
    coolHue: (p) => 180 + p * 100, // cyan → purple
    hotHue: (p) => 10 + p * 50, // red → orange → yellow
    threshold: 0.55,
    saturation: 95,
  },
  {
    name: "Inferno",
    coolHue: (p) => 0 + p * 30, // deep red → orange
    hotHue: (p) => 30 + p * 30, // orange → yellow
    threshold: 0.4,
    saturation: 100,
  },
  {
    name: "Ocean",
    coolHue: (p) => 190 + p * 40, // teal → blue
    hotHue: (p) => 160 + p * 60, // cyan → blue-green
    threshold: 0.6,
    saturation: 80,
  },
  {
    name: "Aurora",
    coolHue: (p) => 120 + p * 160, // green → purple
    hotHue: (p) => 280 + p * 80, // violet → pink
    threshold: 0.5,
    saturation: 85,
  },
  {
    name: "Mono",
    coolHue: () => 0, // white/gray
    hotHue: () => 0,
    threshold: 0.5,
    saturation: 0,
  },
];

export function getHue(
  scheme: ColorScheme,
  energy: { low: number; mid: number; high: number },
  position: number,
): { hue: number; saturation: number } {
  const intensity = energy.low * 0.5 + energy.mid * 0.3 + energy.high * 0.2;
  const hue =
    intensity > scheme.threshold
      ? scheme.hotHue(position)
      : scheme.coolHue(position);
  return { hue, saturation: scheme.saturation };
}
