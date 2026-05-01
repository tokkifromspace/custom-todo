// Distinct project colors. New projects pick the first palette entry
// not currently used; if all are used, the least-used one wins.
export const PROJECT_COLORS = [
  "oklch(0.62 0.13 205)", // sky
  "oklch(0.6 0.11 195)",  // teal-blue
  "oklch(0.65 0.10 230)", // blue
  "oklch(0.6 0.13 250)",  // indigo
  "oklch(0.62 0.13 285)", // purple
  "oklch(0.6 0.11 290)",  // violet
  "oklch(0.62 0.13 305)", // magenta
  "oklch(0.6 0.13 320)",  // pink-magenta
  "oklch(0.65 0.13 350)", // pink
  "oklch(0.65 0.13 25)",  // red
  "oklch(0.7 0.13 60)",   // orange
  "oklch(0.7 0.12 100)",  // yellow-green
  "oklch(0.65 0.13 140)", // green
  "oklch(0.6 0.12 165)",  // mint
];

export function pickProjectColor(usedColors: readonly string[]): string {
  const used = new Set(usedColors);
  const unused = PROJECT_COLORS.find((c) => !used.has(c));
  if (unused) return unused;
  // All palette entries used — pick the least frequent so duplicates spread out
  const counts = new Map<string, number>();
  for (const c of usedColors) counts.set(c, (counts.get(c) ?? 0) + 1);
  let best = PROJECT_COLORS[0];
  let min = Infinity;
  for (const c of PROJECT_COLORS) {
    const cnt = counts.get(c) ?? 0;
    if (cnt < min) {
      min = cnt;
      best = c;
    }
  }
  return best;
}
