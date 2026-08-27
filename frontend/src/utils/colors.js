/**
 * Heat and HERI color scales for map visualization
 */

export const HEAT_COLORS = [
  [11, 15, 25],    // Dark baseline
  [217, 242, 255], // Coolest (light blue)
  [255, 236, 217], // Warm
  [255, 161, 90],  // Hot
  [255, 76, 26],   // Very Hot
  [191, 22, 0]     // Extreme
];

export const HERI_COLORS = [
  [34, 197, 94, 160],   // Low (<40): Green
  [234, 179, 8, 190],   // Moderate (40-59): Yellow
  [249, 115, 22, 210],  // High (60-79): Orange
  [239, 68, 68, 230]    // Critical (>=80): Red
];

/**
 * Returns an RGB array [R, G, B] based on a normalized value (0-1)
 */
export function getHeatColor(normalizedValue) {
  const index = Math.floor(normalizedValue * (HEAT_COLORS.length - 1));
  return HEAT_COLORS[Math.min(Math.max(index, 0), HEAT_COLORS.length - 1)];
}

/**
 * Returns an RGBA array [R, G, B, A] based on HERI score (0-100)
 */
export function getHeriColor(heriScore) {
  if (heriScore >= 80) return [239, 68, 68, 230];
  if (heriScore >= 60) return [249, 115, 22, 210];
  if (heriScore >= 40) return [234, 179, 8, 190];
  return [34, 197, 94, 160];
}
