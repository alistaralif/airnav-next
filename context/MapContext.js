/**
 * MapContext.jsx
 *
 * Provides global access to the Mapbox map instance and exposes methods for
 * controlling layers, centering, and future map interactions.
 */
"use client";

import { createContext, useContext, useRef, useState, useEffect } from "react";
import { COLORS } from "../components/Mapbox/colors.js";
import { LAYERS } from "../components/Mapbox/layerConfig.js";

const MapContext = createContext();

export function MapProvider({ children }) {
  // Stores the actual Mapbox map instance (assigned after initialization)
  const mapRef = useRef(null);

  // Tracks layer visibility state for FIRs, navigation warnings, and waypoints
  const [layerVisibility, setLayerVisibility] = useState({});

  /**
   * Initializes default visibility state from LAYERS config.
   */
  useEffect(() => {
    const defaults = {};
    LAYERS.forEach((layer) => {
      defaults[layer.group] = layer.layout?.visibility === "visible";
    });
    setLayerVisibility(defaults);
  }, []);

  useEffect(() => {
    const defaults = {};
    LAYERS.forEach((layer) => {
      // Only initialize per group once
      if (!defaults[layer.group]) {
        const isVisible = layer.layout?.visibility === "visible";
        defaults[layer.group] = isVisible;
      }
    });
    setLayerVisibility(defaults);
  }, []);
  

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
    if (!map) {
    console.warn("⚠️ Map instance not ready yet.");
    return;
    }

    const newVisibility = !layerVisibility[layerGroup];

    // Find all layers belonging to this group
    const relatedLayers = LAYERS.filter((layer) => layer.group === layerGroup);

    relatedLayers.forEach((layer) => {
      const targetIds = [layer.id, layer.outline?.id].filter(Boolean);
      targetIds.forEach((id) => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(
            id,
            "visibility",
            newVisibility ? "visible" : "none"
          );
        }
      });
    });

    setLayerVisibility((prev) => ({
      ...prev,
      [layerGroup]: newVisibility,
    }));
    console.log(`Toggling ${layerGroup}: ${newVisibility ? "visible" : "none"}`);

  };

  /**
   * Dynamically builds legend entries for currently visible layers.
   */
  const getLegends = () => {
    const legends = [];
    LAYERS.forEach((layer) => {
      const isVisible = layerVisibility[layer.group];
      if (!isVisible) return;

      if (layer.group === "navWarnings") {
        legends.push({ label: "Prohibited Area", color: COLORS.prohibited, shape: "square" });
        legends.push({ label: "Restricted Area", color: COLORS.restricted, shape: "square" });
        legends.push({ label: "Danger Area", color: COLORS.danger, shape: "square" });
      } else if (layer.group === "waypoints") {
        legends.push({ label: "Waypoints", color: COLORS.waypoint, shape: "circle" });
        legends.push({ label: "Waypoints (DME)", color: COLORS.waypointDME, shape: "circle" });
      } else {
        legends.push({ label: layer.label, color: layer.paint["fill-color"] || COLORS.highlight, shape: "square" });
      }
    });
    return legends;
  };

  // const toggleLayerVisibility = (layerGroup) => {
  //   const map = mapRef.current;
  //   if (!map) return;

  //   const newVisibility = !layerVisibility[layerGroup];

  //   // Define mapping between logical names and actual Mapbox layer IDs
  //   const layerIds = {
  //     firs: ["firs-fill", "firs-outline"],
  //     navWarnings: ["navWarnings-fill", "navWarnings-outline"],
  //     waypoints: ["waypoints"],
  //   }[layerGroup];

  //   // Update layer visibility in the map
  //   layerIds.forEach((id) => {
  //     if (map.getLayer(id)) {
  //       map.setLayoutProperty(
  //         id,
  //         "visibility",
  //         newVisibility ? "visible" : "none"
  //       );
  //     }
  //   });

  //   // Update state for UI synchronization
  //   setLayerVisibility((prev) => ({ ...prev, [layerGroup]: newVisibility }));
  // };

  // /**
  //  * Returns an array of legend objects based on currently visible layers.
  //  * Each object contains a label, color, and shape type.
  //  */
  // const getLegends = () => {
  //   const legends = [];
  //   if (layerVisibility.firs) {
  //     legends.push({ label: "FIRs", color: COLORS.fir, shape: "square" });
  //   }
  //   if (layerVisibility.navWarnings) {
  //     legends.push({ label: "Prohibited Area", color: COLORS.prohibited, shape: "square" });
  //     legends.push({ label: "Restricted Area", color: COLORS.restricted, shape: "square" });
  //     legends.push({ label: "Danger Area", color: COLORS.danger, shape: "square" });
  //   }
  //   if (layerVisibility.waypoints) {
  //     legends.push({ label: "Waypoints", color: COLORS.waypoint, shape: "circle" });
  //     legends.push({ label: "Waypoints (DME)", color: COLORS.waypointDME, shape: "circle" });
  //   }
  //   return legends;
  // };

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
