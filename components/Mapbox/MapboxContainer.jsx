/**
 * MapboxContainer.jsx
 *
 * Responsible for initializing and rendering the Mapbox GL map.
 * Displays FIRs, navigation warnings, and waypoints using locally stored GeoJSON files.
 * In the future, these data sources can be loaded from backend APIs via fetch().
 *
 * This component is independent from the UI (Navbar, Sidebar, etc.) and focuses solely on map rendering.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { COLORS } from "./colors.js";     // Color palette definitions for each data layer
import { useMap } from "@/context/MapContext";

// Mapbox public token for rendering the map
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Mapbox style to be used
const MAP_STYLE = "mapbox://styles/mapbox/light-v11";

export default function MapboxContainer() {
  // Stores map instance and container reference
  const mapRef = useRef(null);  // Actual Mapbox map instance
  const mapContainerRef = useRef(null);   // HTML container for the map
  const [mapLoaded, setMapLoaded] = useState(false);  // Tracks if map has finished loading
  const { setMapInstance } = useMap();  // Context method to expose map instance to the context for access in other components globally


  // Initializes the map only once upon mounting
  useEffect(() => {
    // Prevent multiple initializations
    if (mapRef.current) return;

    // Create a new Mapbox GL map instance
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [104.2, 2.0],
      zoom: 6,
    });

    // Local variable for managing popups
    let activePopup = null;

    // Close popups when clicking elsewhere on the map
    map.on("click", (e) => {
      const features = map.queryRenderedFeatures(e.point, {     // Check if clicking on any interactive features
        layers: ["waypoints", "firs-fill", "navWarnings-fill"],
      });
      if (!features.length && activePopup) {    // If not clicking on a feature, close any open popup
        activePopup.remove();
        activePopup = null;
      }
    });

    // When the map finishes loading, add all data sources and layers
    map.on("load", () => {
      /** ---------------- FIRs ---------------- */
      map.addSource("firs", { type: "geojson", data: "/FIRs.geojson" });

      map.addLayer({
        id: "firs-fill",
        type: "fill",
        source: "firs",
        paint: { "fill-color": COLORS.fir, "fill-opacity": 0.08 },
        layout: { visibility: "visible" },
      });

      map.addLayer({
        id: "firs-outline",
        type: "line",
        source: "firs",
        paint: { "line-color": COLORS.firOutline, "line-width": 1.2 },
        layout: { visibility: "visible" },
      });

      // Popup for FIR polygons
      map.on("click", "firs-fill", (e) => {
        const props = e.features[0].properties;
        const html = buildPopupHTML({
          title: props?.name || "Unknown FIR",
          subtitle: props?.subtitle || "",
          color: COLORS.firOutline,
        });

        if (activePopup) activePopup.remove();      // Remove existing popup
        activePopup = new mapboxgl.Popup({ closeButton: true })     // New popup
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map);
      });

      /** ---------------- Navigation Warnings ---------------- */
      map.addSource("navWarnings", {
        type: "geojson",
        data: "/NavWarnings.geojson",
      });

      map.addLayer({
        id: "navWarnings-fill",
        type: "fill",
        source: "navWarnings",
        paint: {
          "fill-color": [
            "match",
            ["get", "category"],
            "prohibited",
            COLORS.prohibited,
            "restricted",
            COLORS.restricted,
            "danger",
            COLORS.danger,
            "#cccccc",
          ],
          "fill-opacity": 0.35,
        },
        layout: { visibility: "none" },
      });

      map.addLayer({
        id: "navWarnings-outline",
        type: "line",
        source: "navWarnings",
        paint: {
          "line-color": [
            "match",
            ["get", "category"],
            "prohibited",
            COLORS.prohibited,
            "restricted",
            COLORS.restricted,
            "danger",
            COLORS.danger,
            "#999999",
          ],
          "line-width": 1.2,
        },
        layout: { visibility: "none" },
      });

      // Popup for navigation warnings
      map.on("click", "navWarnings-fill", (e) => {
        const props = e.features[0].properties;
        const html = buildPopupHTML({
          title: props?.name || "Unnamed Area",
          subtitle: props?.subtitle || "",
          color: COLORS[props?.category?.toLowerCase()] || "#888",
        });

        if (activePopup) activePopup.remove();
        activePopup = new mapboxgl.Popup({ closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map);
      });

      /** ---------------- Waypoints ---------------- */
      map.addSource("waypoints", {
        type: "geojson",
        data: "/Waypoints.geojson",
      });

      map.addLayer({
        id: "waypoints",
        type: "circle",
        source: "waypoints",
        paint: {
          "circle-radius": 4,
          "circle-color": [
            "match",
            ["get", "dme"],
            "false",
            COLORS.waypoint,
            "true",
            COLORS.waypointDME,
            "#cccccc",
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": COLORS.waypoint,
        },
        layout: { visibility: "none" },
      });

      // Popup for waypoints
      map.on("click", "waypoints", (e) => {
        const coords = e.features[0].geometry.coordinates.slice();
        const props = e.features[0].properties;
        const html = buildPopupHTML({
          title: props?.name || "Unnamed Waypoint",
          subtitle: `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`,
          color: props?.dme === "true" ? COLORS.waypointDME : COLORS.waypoint,
        });

        if (activePopup) activePopup.remove();
        activePopup = new mapboxgl.Popup({ closeButton: false })
          .setLngLat(coords)
          .setHTML(html)
          .addTo(map);
      });

      setMapLoaded(true);
    });

    // Assign map instance reference for global control
    mapRef.current = map;

    // Expose map instance to context for access in other components
    setMapInstance(map);

    // Cleanup on unmount
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /**
   * Builds styled popup HTML for map features.
   * @param {Object} info - Contains title, subtitle, and color.
   * @returns {string} - Styled HTML string for Mapbox popup.
   */
  function buildPopupHTML({ title, subtitle, color }) {
    return `
      <div style="
        background: white;
        border: 3px solid ${color};
        border-radius: 10px;
        padding: 10px 14px;
        box-shadow: 0 2px 2px rgba(0, 0, 0, 0.25);
        font-family: 'Inter', sans-serif;
        color: #222;
        min-width: 120px;
        height: auto;
        text-align: center;">
        <div style="font-weight: 700; font-size: 0.95em; color: ${color}; margin-bottom: 3px;">
          ${title}
        </div>
        <div style="font-size: 0.85em; color: #555;">
          ${subtitle}
        </div>
      </div>`;
  }

  // Returns map container; uses full width (will be restricted by CSS later)
  return (
    <div
      ref={mapContainerRef}
      className="mapbox-container"
      style={{ width: "95vw", height: "100vh" }}
    />
  );
}

// Future improvement: replace hardcoded data: "/file.geojson" with fetch("/api/data?type=fir") once the backend is set up.