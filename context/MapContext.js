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
  // Stores the actual Mapbox map instance
  const mapRef = useRef(null);

  // Tracks layer visibility state for FIRs, navigation warnings, and waypoints
  const [layerVisibility, setLayerVisibility] = useState({});

  // Tracks per-layer category visibility (for sublayers)
  const [categoryVisibility, setCategoryVisibility] = useState({});

  // Tracks floating legend visibility for layers without sublayers
  const [legendVisibility, setLegendVisibility] = useState({});

  // Tracks radius circle state for drawing circles on the map
  const [radiusCircle, setRadiusCircle] = useState({
    center: null,
    radius: 40,
    visible: false,
  });

  /**
   * Sets the visibility of the radius circle.
   * @param {boolean} visible - Whether the circle should be visible.
   */
  const setRadiusCircleVisible = (visible) => {
    setRadiusCircle((prev) => ({ ...prev, visible }));
  };

  /**
   * Sets the radius of the circle.
   * @param {number} radius - The radius in nautical miles.
   */
  const setRadiusCircleRadius = (radius) => {
    setRadiusCircle((prev) => ({ ...prev, radius }));
  };

  /**
   * Initializes default visibility state from LAYERS config.
   */
  useEffect(() => {
    const defaults = {};
    const legendDefaults = {};
    LAYERS.forEach((layer) => {
      if (!defaults[layer.group]) {
        const isVisible = layer.layout?.visibility === "visible";
        defaults[layer.group] = isVisible;
        legendDefaults[layer.group] = true; // Legend items start visible
      }
    });
    setLayerVisibility(defaults);
    setLegendVisibility(legendDefaults);
  }, []);

  /**
   * Initialize categoryVisibility defaults (all true)
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
   * @param {object} map - Mapbox GL map instance.
   */
  const setMapInstance = (map) => {
    mapRef.current = map;
  };

  /**
   * Returns the current map instance.
   * @returns {object|null} - Mapbox GL map instance or null.
   */
  const getMapInstance = () => {
    return mapRef.current;
  };

  /**
   * Reloads sectors layer data from the API.
   * Call this after login/logout to refresh Singapore sectors.
   */
  const reloadSectorsLayer = async () => {
    const map = mapRef.current;
    if (!map) return;

    try {
      const response = await fetch("/api/sectors");
      const data = await response.json();

      const source = map.getSource("sectors-fill");
      if (source) {
        source.setData(data);
      }
    } catch (error) {
      console.error("Error reloading sectors:", error);
    }
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

    setCategoryVisibility((prev) => {
      const current = prev[group] || {};
      const newVisibility = !current[categoryKey];
      const updated = {
        ...prev,
        [group]: { ...current, [categoryKey]: newVisibility },
      };

      const layerConfig = LAYERS.find((l) => l.group === group);
      if (!layerConfig?.categoryField) return updated;

      const activeKeys = Object.entries(updated[group])
        .filter(([_, visible]) => visible)
        .map(([key]) => key);

      const filter =
        activeKeys.length > 0
          ? ["in", ["get", layerConfig.categoryField], ["literal", activeKeys]]
          : ["==", ["get", layerConfig.categoryField], "__none__"];

      map.setFilter(layerConfig.id, filter);
      if (layerConfig.outline?.id) {
        map.setFilter(layerConfig.outline.id, filter);
      }

      return updated;
    });
  };

  /**
   * Toggles legend visibility for layers without sublayers.
   * This only affects the floating legend, not the main layer panel checkbox.
   * @param {string} group - The layer group name.
   */
  const toggleLegendVisibility = (group) => {
    const map = mapRef.current;
    if (!map) return;

    setLegendVisibility((prev) => {
      const newVisibility = !prev[group];

      // Find all layers belonging to this group and toggle their map visibility
      const relatedLayers = LAYERS.filter((layer) => layer.group === group);
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

      return { ...prev, [group]: newVisibility };
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

      if (layer.sublayers) {
        layer.sublayers.forEach((sub) => {
          legends.push({
            group: layer.group,
            category: sub.key,
            label: sub.label,
            color: sub.color,
            shape: isCircle ? "circle" : "square",
            flag: sub.flag ?? null,
          });
        });
      } else {
        legends.push({
          group: layer.group,
          label: layer.label,
          color:
            layer.paint?.["fill-color"] ||
            layer.paint?.["circle-color"] ||
            COLORS.highlight,
          shape: isCircle ? "circle" : "square",
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
        getMapInstance,
        reloadSectorsLayer,
        layerVisibility,
        toggleLayerVisibility,
        categoryVisibility,
        toggleCategoryVisibility,
        legendVisibility,
        toggleLegendVisibility,
        getLegends,
        radiusCircle,
        setRadiusCircle,
        setRadiusCircleVisible,
        setRadiusCircleRadius,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export const useMap = () => useContext(MapContext);
