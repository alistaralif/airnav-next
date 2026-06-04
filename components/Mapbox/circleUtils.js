import * as turf from "@turf/turf";
import { RING_COLORS } from "./colors";

// Airport centers as [lng, lat]
export const WSSS_COORDS = [ 103.9896372029808, 1.3592955583344983] // Singapore Changi
export const WMKK_COORDS = [101.7018, 2.7425]   // Kuala Lumpur Intl
export const WIII_COORDS = [106.6601, -6.1238]  // Jakarta Soekarno-Hatta
export const VVTS_COORDS = [106.6566, 10.8175]  // Ho Chi Minh City International Airport
export const VVCT_COORDS = [105.7122, 10.0807]  // Can Tho International Airport
export const VTBS_COORDS = [100.7470, 13.6830]  // Suvarnabhumi International Airport

// Predefined distance rings: one per airport center, each with its own color.
// Add a new entry here to render another ring.
export const DISTANCE_RINGS = [
  { id: "wsss", label: "Changi (WSSS)", center: WSSS_COORDS, color: RING_COLORS[0] },
  { id: "wmkk", label: "KLIA (WMKK)", center: WMKK_COORDS, color: RING_COLORS[1] },
  { id: "wiii", label: "Soekarno-Hatta (WIII)", center: WIII_COORDS, color: RING_COLORS[2] },
  { id: "vvts", label: "Tan Son Nhat (VVTS)", center: VVTS_COORDS, color: RING_COLORS[3] },
  // { id: "vvct", label: "VVCT", center: VVCT_COORDS, color: RING_COLORS[2] },
  { id: "vtbs", label: "Suvarnabhumi (VTBS)", center: VTBS_COORDS, color: RING_COLORS[4] },
];

// Available radius values in nautical miles
export const RADIUS_VALUES = [1, 2, 5, 10, 20, 30, 40, 50, 60, 80, 100,
    150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000,
    1200, 1400, 1600, 1800, 2000,
    2500, 3000, 3500, 4000, 4500, 5000];

/**
 * Generates a GeoJSON circle polygon centered at given coordinates
 * @param {number[]} center - [lng, lat] coordinates
 * @param {number} radiusNM - radius in nautical miles
 * @returns {Object} GeoJSON Feature
 */
export function createCircleGeoJSON(center, radiusNM) {
  // Convert nautical miles to kilometers (1 NM = 1.852 km)
  const radiusKm = radiusNM * 1.852;
  
  // Create circle using turf.js
  const circle = turf.circle(center, radiusKm, {
    steps: 100,
    units: "kilometers",
  });

  circle.properties = {
    name: `${radiusNM} NM Radius`,
    center: "WSSS",
    radiusNM: radiusNM,
  };

  return circle;
}