/**
 * Format distance with appropriate precision
 * - Below threshold: 2 decimal places
 * - Threshold and above: rounded to integer
 * @param {number} value - The distance value
 * @param {number} threshold - The threshold above which to round to integer
 * @returns {string}
 */
export function formatDistance(value, threshold) {
  if (value >= threshold) {
    return Math.round(value).toString();
  }
  return value.toFixed(2);
}

// Thresholds for NM and KM
export const NM_THRESHOLD = 55;
export const KM_THRESHOLD = 100;