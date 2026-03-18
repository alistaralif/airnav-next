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

const LINE_SOURCE_ID = "measurement-line-source";
const LINE_LAYER_ID = "measurement-line";
const LABEL_SOURCE_ID = "measurement-label-source";
const LABEL_NM_LAYER_ID = "measurement-label-nm";
const LABEL_KM_LAYER_ID = "measurement-label-km";

const EMPTY_LINE_FEATURE = {
  type: "Feature",
  geometry: { type: "LineString", coordinates: [] },
  properties: {},
};

const EMPTY_LABEL_FEATURE = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [0, 0] },
  properties: { nmDistance: "", kmDistance: "" },
};

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

  const ensureLayers = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return false;

    if (!map.getSource(LINE_SOURCE_ID)) {
      map.addSource(LINE_SOURCE_ID, {
        type: "geojson",
        data: EMPTY_LINE_FEATURE,
      });
    }

    if (!map.getLayer(LINE_LAYER_ID)) {
      map.addLayer({
        id: LINE_LAYER_ID,
        type: "line",
        source: LINE_SOURCE_ID,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#1e293b",
          "line-width": 2,
          "line-opacity": 0.95,
          "line-dasharray": [5, 2],
        },
      });
    }

    if (!map.getSource(LABEL_SOURCE_ID)) {
      map.addSource(LABEL_SOURCE_ID, {
        type: "geojson",
        data: EMPTY_LABEL_FEATURE,
      });
    }

    if (!map.getLayer(LABEL_NM_LAYER_ID)) {
      map.addLayer({
        id: LABEL_NM_LAYER_ID,
        type: "symbol",
        source: LABEL_SOURCE_ID,
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
    }

    if (!map.getLayer(LABEL_KM_LAYER_ID)) {
      map.addLayer({
        id: LABEL_KM_LAYER_ID,
        type: "symbol",
        source: LABEL_SOURCE_ID,
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
    }

    return true;
  }, [map]);

  const bringToFront = useCallback(() => {
    if (!map) return;
    if (map.getLayer(LINE_LAYER_ID)) map.moveLayer(LINE_LAYER_ID);
    if (map.getLayer(LABEL_NM_LAYER_ID)) map.moveLayer(LABEL_NM_LAYER_ID);
    if (map.getLayer(LABEL_KM_LAYER_ID)) map.moveLayer(LABEL_KM_LAYER_ID);
  }, [map]);

  const updateLine = useCallback(() => {
    if (!map || !ensureLayers()) return;

    const points = pointsRef.current;

    const lineData = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: points.length >= 2 ? points : [],
      },
      properties: {},
    };

    const lineSource = map.getSource(LINE_SOURCE_ID);
    if (lineSource) {
      lineSource.setData(lineData);
    }

    if (points.length === 2) {
      const { km, nm } = calculateDistance(points[0], points[1]);
      const midpoint = getMidpoint(points[0], points[1]);

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

      const labelSource = map.getSource(LABEL_SOURCE_ID);
      if (labelSource) {
        labelSource.setData(labelData);
      }

      if (onMeasurementChange) {
        onMeasurementChange({ km, nm, points });
      }
    } else {
      const labelSource = map.getSource(LABEL_SOURCE_ID);
      if (labelSource) {
        labelSource.setData(EMPTY_LABEL_FEATURE);
      }
    }

    bringToFront();
  }, [map, ensureLayers, bringToFront, onMeasurementChange]);

  const addPoint = useCallback(
    (lngLat) => {
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
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    pointsRef.current = [];

    if (map && ensureLayers()) {
      const lineSource = map.getSource(LINE_SOURCE_ID);
      if (lineSource) lineSource.setData(EMPTY_LINE_FEATURE);

      const labelSource = map.getSource(LABEL_SOURCE_ID);
      if (labelSource) labelSource.setData(EMPTY_LABEL_FEATURE);
    }

    if (onMeasurementChange) {
      onMeasurementChange(null);
    }
  }, [map, ensureLayers, onMeasurementChange]);

  useEffect(() => {
    if (!map) return;

    const setupLayers = () => {
      if (!ensureLayers()) return;
      updateLine();
      bringToFront();
    };

    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.once("load", setupLayers);
    }

    map.on("style.load", setupLayers);
    map.on("sourcedata", bringToFront);

    return () => {
      try {
        map.off("style.load", setupLayers);
        map.off("sourcedata", bringToFront);
      } catch (e) {
        // Map was already removed, ignore
      }
    };
  }, [map, ensureLayers, updateLine, bringToFront]);

  useEffect(() => {
    if (!map) return;

    const handleClick = (e) => {
      if (!isActive) return;

      if (pointsRef.current.length >= 2) {
        clearMeasurement();
      }

      addPoint(e.lngLat);
    };

    map.on("click", handleClick);

    try {
      if (isActive) {
        map.getCanvas().style.cursor = "crosshair";
        bringToFront();
      } else {
        map.getCanvas().style.cursor = "";
      }
    } catch (e) {
      // Map canvas not available, ignore
    }

    return () => {
      try {
        map.off("click", handleClick);
        const canvas = map.getCanvas();
        if (canvas) {
          canvas.style.cursor = "";
        }
      } catch (e) {
        // Map was already removed, ignore
      }
    };
  }, [map, isActive, addPoint, clearMeasurement, bringToFront]);

  useEffect(() => {
    if (!isActive) {
      clearMeasurement();
    }
  }, [isActive, clearMeasurement]);

  return null;
}
