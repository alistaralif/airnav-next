import * as turf from "@turf/turf";

// WSSS (Singapore Changi Airport) coordinates
export const WSSS_COORDS = [ 103.9896372029808, 1.3592955583344983]

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