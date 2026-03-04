/**
 * MeasurementTool.jsx
 * 
 * A ruler tool that allows users to place two pins on the map
 * and displays the distance between them in NM and KM.
 */
import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { formatDistance, NM_THRESHOLD, KM_THRESHOLD } from "./distanceUtils";

// Conversion constants
const KM_TO_NM = 0.539957;
const EARTH_RADIUS_KM = 6371;

/**
 * Calculate distance between two points using Haversine formula
 * @param {number[]} coord1 - [lng, lat]
 * @param {number[]} coord2 - [lng, lat]
 * @returns {{ km: number, nm: number }}
 */
function calculateDistance(coord1, coord2) {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = EARTH_RADIUS_KM * c;
  const nm = km * KM_TO_NM;

  return { km, nm };
}

/**
 * Get midpoint between two coordinates
 */
function getMidpoint(coord1, coord2) {
  return [(coord1[0] + coord2[0]) / 2, (coord1[1] + coord2[1]) / 2];
}

export default function MeasurementTool({ map, isActive, onMeasurementChange }) {
  const markersRef = useRef([]);
  const pointsRef = useRef([]);

  const updateLine = useCallback(() => {
    if (!map) return;

    const points = pointsRef.current;

    // Update or create line source
    const lineData = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: points.length >= 2 ? points : [],
      },
    };

    if (map.getSource("measurement-line")) {
      map.getSource("measurement-line").setData(lineData);
    }

    // Calculate and display distance if we have 2 points
    if (points.length === 2) {
      const { km, nm } = calculateDistance(points[0], points[1]);
      const midpoint = getMidpoint(points[0], points[1]);

      // Update label
      const labelData = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: midpoint,
        },
        properties: {
          nmDistance: `${formatDistance(nm, NM_THRESHOLD)} NM`,
          kmDistance: `${formatDistance(km, KM_THRESHOLD)} KM`,
        },
      };

      if (map.getSource("measurement-label")) {
        map.getSource("measurement-label").setData(labelData);
      }

      // Callback with measurement data
      if (onMeasurementChange) {
        onMeasurementChange({ km, nm, points });
      }
    } else {
      // Clear label when less than 2 points
      if (map.getSource("measurement-label")) {
        map.getSource("measurement-label").setData({
          type: "Feature",
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: { nmDistance: "", kmDistance: "" },
        });
      }
    }
  }, [map, onMeasurementChange]);

  const addPoint = useCallback(
    (lngLat) => {
      if (!map || pointsRef.current.length >= 2) return;

      const coords = [lngLat.lng, lngLat.lat];
      pointsRef.current.push(coords);

      // Create draggable marker
      const markerEl = document.createElement("div");
      markerEl.className = "measurement-marker";
      markerEl.innerHTML = `
        <div style="
          width: 24px;
          height: 24px;
          background:rgba(30, 41, 59, 0.9);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: grab;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          color: white;
        ">${pointsRef.current.length}</div>
      `;

      const marker = new mapboxgl.Marker({
        element: markerEl,
        draggable: true,
      })
        .setLngLat(coords)
        .addTo(map);

      const markerIndex = markersRef.current.length;
      markersRef.current.push(marker);

      // Update line when marker is dragged
      marker.on("drag", () => {
        const newLngLat = marker.getLngLat();
        pointsRef.current[markerIndex] = [newLngLat.lng, newLngLat.lat];
        updateLine();
      });

      updateLine();
    },
    [map, updateLine]
  );

  const clearMeasurement = useCallback(() => {
    // Remove markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    pointsRef.current = [];

    // Clear line and label
    if (map) {
      if (map.getSource("measurement-line")) {
        map.getSource("measurement-line").setData({
          type: "Feature",
          geometry: { type: "LineString", coordinates: [] },
        });
      }
      if (map.getSource("measurement-label")) {
        map.getSource("measurement-label").setData({
          type: "Feature",
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: { nmDistance: "", kmDistance: "" },
        });
      }
    }

    if (onMeasurementChange) {
      onMeasurementChange(null);
    }
  }, [map, onMeasurementChange]);

  // Setup map sources and layers
  useEffect(() => {
    if (!map) return;

    const setupLayers = () => {
      // Add line source and layer
      if (!map.getSource("measurement-line")) {
        map.addSource("measurement-line", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: [] },
          },
        });
      }

      // Add or move line layer to top
      if (!map.getLayer("measurement-line")) {
        map.addLayer({
          id: "measurement-line",
          type: "line",
          source: "measurement-line",
          paint: {
            "line-color": "rgba(30, 41, 59, 1)",
            "line-width": 3,
            "line-dasharray": [2, 2],
          },
        });
      } else {
        // Move to top if it already exists
        map.moveLayer("measurement-line");
      }

      // Add label source
      if (!map.getSource("measurement-label")) {
        map.addSource("measurement-label", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "Point", coordinates: [0, 0] },
            properties: { nmDistance: "", kmDistance: "" },
          },
        });
      }

      // NM label (above line)
      if (!map.getLayer("measurement-label-nm")) {
        map.addLayer({
          id: "measurement-label-nm",
          type: "symbol",
          source: "measurement-label",
          layout: {
            "text-field": ["get", "nmDistance"],
            "text-size": 14,
            "text-offset": [0, -1.5],
            "text-anchor": "center",
            "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          },
          paint: {
            "text-color": "rgba(30, 41, 59, 0.9)",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
          },
        });
      } else {
        map.moveLayer("measurement-label-nm");
      }

      // KM label (below line)
      if (!map.getLayer("measurement-label-km")) {
        map.addLayer({
          id: "measurement-label-km",
          type: "symbol",
          source: "measurement-label",
          layout: {
            "text-field": ["get", "kmDistance"],
            "text-size": 12,
            "text-offset": [0, 1.5],
            "text-anchor": "center",
            "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          },
          paint: {
            "text-color": "#6b7280",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
          },
        });
      } else {
        map.moveLayer("measurement-label-km");
      }
    };

    // Check if style is already loaded
    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.once("load", setupLayers);
    }

    // Handle style changes (if user switches map style)
    map.on("style.load", setupLayers);

    // Also move layers to top when tool becomes active
    const bringToFront = () => {
      if (map.getLayer("measurement-line")) map.moveLayer("measurement-line");
      if (map.getLayer("measurement-label-nm")) map.moveLayer("measurement-label-nm");
      if (map.getLayer("measurement-label-km")) map.moveLayer("measurement-label-km");
    };

    // Listen for when other layers are added, to ensure measurement stays on top
    map.on("sourcedata", bringToFront);

    return () => {
      map.off("style.load", setupLayers);
      map.off("sourcedata", bringToFront);
    };
  }, [map]);

  // Handle click events when tool is active
  useEffect(() => {
    if (!map) return;

    const handleClick = (e) => {
      if (!isActive) return;

      // If we already have 2 points, clear and start fresh
      if (pointsRef.current.length >= 2) {
        clearMeasurement();
      }

      addPoint(e.lngLat);
    };

    map.on("click", handleClick);

    // Change cursor when active
    if (isActive) {
      map.getCanvas().style.cursor = "crosshair";
    } else {
      map.getCanvas().style.cursor = "";
    }

    return () => {
      map.off("click", handleClick);
      map.getCanvas().style.cursor = "";
    };
  }, [map, isActive, addPoint, clearMeasurement]);

  // Cleanup when tool is deactivated
  useEffect(() => {
    if (!isActive) {
      clearMeasurement();
    }
  }, [isActive, clearMeasurement]);

  return null; // This component doesn't render anything directly
}