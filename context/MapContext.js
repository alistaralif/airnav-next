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

  // Tracks per-layer category visibility (for sublayers)
  const [categoryVisibility, setCategoryVisibility] = useState({});

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
  Initialize categoryVisibility defaults (all true)
  */
  useEffect(() => {
    const defaults = {};
    LAYERS.forEach((layer) => {
      if (layer.sublayers) {
        defaults[layer.group] = {};
        layer.sublayers.forEach((sub) => {
          defaults[layer.group][sub.key] = true;
        });
      }
    });
    setCategoryVisibility(defaults);
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
   * Toggles visibility of a specific category within a layer group.
   * Dynamically builds filters for any layer that defines categoryField.
   * @param {string} group - The layer group name.
   * @param {string} categoryKey - The specific category key to toggle.
   */
  const toggleCategoryVisibility = (group, categoryKey) => {
    const map = mapRef.current;
    if (!map) return;
  
    // --- 1. Initialize nested visibility if missing ---
    setCategoryVisibility((prev) => {
      const current = prev[group] || {};
      const newVisibility = !current[categoryKey];
      const updated = {
        ...prev,
        [group]: { ...current, [categoryKey]: newVisibility },
      };
  
      // --- 2. Rebuild filter for this layer ---
      const layerConfig = LAYERS.find((l) => l.group === group);
      if (!layerConfig?.categoryField) return updated;
  
      const activeKeys = Object.entries(updated[group])
        .filter(([_, visible]) => visible)
        .map(([key]) => key);
  
      // Default: if all turned off, show nothing
      const filter =
        activeKeys.length > 0
          ? ["in", ["get", layerConfig.categoryField], ["literal", activeKeys]]
          : ["==", ["get", layerConfig.categoryField], "__none__"]; // show none
  
      // Apply filter to fill + outline if present
      map.setFilter(layerConfig.id, filter);
      if (layerConfig.outline?.id) {
        map.setFilter(layerConfig.outline.id, filter);
      }
  
      return updated;
    });
  };
  


  /**
   * Dynamically builds legend entries for currently visible layers.
   */
  const getLegends = () => {
    const legends = [];
  
    LAYERS.forEach((layer) => {
      const isVisible = layerVisibility[layer.group];
      const isCircle = layer.type === "circle";
      if (!isVisible) return;
  
      // If the layer has defined sublayers, create entries for each
      if (layer.sublayers) {
        layer.sublayers.forEach((sub) => {
          legends.push({
            group: layer.group,
            category: sub.key,
            label: sub.label,
            color: sub.color,
            shape: isCircle? "circle" : "square",
            flag: sub.flag?? null,
          });
        });
      } else {
        // Normal single legend entry
        legends.push({
          group: layer.group,
          label: layer.label,
          color:
            layer.paint?.["fill-color"] ||
            layer.paint?.["circle-color"] ||
            COLORS.highlight,
          shape: layer.type === "circle" ? "circle" : "square",
        });
      }
    });
  
    return legends;
  };

  return (
    <MapContext.Provider
      value={{
        mapRef,
        setMapInstance,
        layerVisibility,
        toggleLayerVisibility,
        categoryVisibility,
        toggleCategoryVisibility,
        getLegends,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

// Hook for easy access to map context from any component
export const useMap = () => useContext(MapContext);
