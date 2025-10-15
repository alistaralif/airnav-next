/**
 * MapContext.jsx
 *
 * Provides global access to the Mapbox map instance and exposes methods for
 * controlling layers, centering, and future map interactions.
 */
"use client";

import { createContext, useContext, useRef, useState } from "react";

const MapContext = createContext();

// Color palette definitions for each data layer
const COLORS = {
    fir: "rgba(95, 134, 149, 0.8)",
    waypoint: "hsl(218, 86.40%, 62.50%)",
    waypointDME: "hsl(17, 100.00%, 60.00%)",
    prohibited: "indianred",
    restricted: "darkorange",
    danger: "gold",
  };

export function MapProvider({ children }) {
  // Stores the actual Mapbox map instance (assigned after initialization)
  const mapRef = useRef(null);

  // Tracks layer visibility state for FIRs, navigation warnings, and waypoints
  const [layerVisibility, setLayerVisibility] = useState({
    firs: true,
    navWarnings: false,
    waypoints: false,
  });

  /**
   * Assigns the map reference when MapboxContainer is initialized.
   * @param {object} mapInstance - Mapbox GL map instance.
   */
  const setMapInstance = (mapInstance) => {
    mapRef.current = mapInstance;
  };

  /**
   * Toggles visibility of a specific layer group.
   * @param {string} layerGroup - The layer name to toggle.
   */
  const toggleLayerVisibility = (layerGroup) => {
    const map = mapRef.current;
    if (!map) return;

    const newVisibility = !layerVisibility[layerGroup];

    // Define mapping between logical names and actual Mapbox layer IDs
    const layerIds = {
      firs: ["firs-fill", "firs-outline"],
      navWarnings: ["navWarnings-fill", "navWarnings-outline"],
      waypoints: ["waypoints"],
    }[layerGroup];

    // Update layer visibility in the map
    layerIds.forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(
          id,
          "visibility",
          newVisibility ? "visible" : "none"
        );
      }
    });

    // Update state for UI synchronization
    setLayerVisibility((prev) => ({ ...prev, [layerGroup]: newVisibility }));
  };

  /**
   * Returns an array of legend objects based on currently visible layers.
   * Each object contains a label, color, and shape type.
   */
  const getLegends = () => {
    const legends = [];
    if (layerVisibility.firs) {
      legends.push({ label: "FIRs", color: COLORS.fir, shape: "square" });
    }
    if (layerVisibility.navWarnings) {
      legends.push({ label: "Prohibited Area", color: COLORS.prohibited, shape: "square" });
      legends.push({ label: "Restricted Area", color: COLORS.restricted, shape: "square" });
      legends.push({ label: "Danger Area", color: COLORS.danger, shape: "square" });
    }
    if (layerVisibility.waypoints) {
      legends.push({ label: "Waypoints", color: COLORS.waypoint, shape: "circle" });
      legends.push({ label: "Waypoints (DME)", color: COLORS.waypointDME, shape: "circle" });
    }
    return legends;
  };

  return (
    <MapContext.Provider
      value={{
        mapRef,
        setMapInstance,
        layerVisibility,
        toggleLayerVisibility,
        getLegends,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

// Hook for easy access to map context from any component
export const useMap = () => useContext(MapContext);
