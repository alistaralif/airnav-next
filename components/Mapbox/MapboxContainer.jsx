/**
 * MapboxContainer.jsx
 *
 * Responsible for initializing and rendering the Mapbox GL map.
 * Displays FIRs, navigation warnings, and waypoints using GeoJSON files.
 * These data sources can be loaded from backend APIs via fetch().
 *
 * This component is independent from the UI (Navbar, Sidebar, etc.) and focuses solely on map rendering.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMap } from "@/context/MapContext";
import { showPopup } from "./popupHelpers";
import FeatureInfoPanel from "@/components/FeatureInfoPanel/FeatureInfoPanel";
import SearchBar from "@/components/Searchbar/Searchbar.jsx";
import FloatingLegend from "./FloatingLegend.jsx";
import { LAYERS } from "./layerConfig.js";

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
  const [selectedFeature, setSelectedFeature] = useState(null); // Currently selected feature for info panel



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

    setMapInstance(map);

    // When the map finishes loading, add all data sources and layers
    map.on("load", () => {
      // Load each layer from the LAYERS configuration
      LAYERS.forEach(async (layer) => {
        const response = await fetch(layer.url);
        const data = await response.json();
        
        // Add source
        map.addSource(layer.id, {
          type: "geojson",
          data,
        });

        // Add main layer
        map.addLayer({
          id: layer.id,
          type: layer.type,
          source: layer.id,
          paint: layer.paint,
          layout: layer.layout || {},
        });
    
        // Add outline layer if defined
        if (layer.outline) {
          map.addLayer({
            id: layer.outline.id,
            type: layer.outline.type,
            source: layer.id,
            paint: layer.outline.paint,
            layout: layer.layout || {},
          });
        }
    
        // Add mapbox popup interaction
        map.on("click", layer.id, (e) => {
          const feature = e.features[0];
          if (layer.id === "waypoints") {
            const coords = feature.geometry.coordinates.slice();
            showPopup(map, feature, coords);
          } else {
          showPopup(map, feature, e.lngLat);
          console.log("map", map, "feature", feature, "e.lngLat", e.lngLat);
          }
        });
      });

      setMapLoaded(true);   // Mark map as loaded after all layers are added
    });

    // Assign map instance reference for global control
    mapRef.current = map;

    // Expose map instance to context for access in other components
    // setMapInstance(map);

     // Attach click listener for any vector/geojson layers
     map.on("click", (e) => {
      // Query rendered features at click position
      const features = map.queryRenderedFeatures(e.point);
      if (!features.length) return;

      const feature = features[0];
      setSelectedFeature(feature); // open info panel
    });

    // Cleanup on unmount
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <>
    <SearchBar onFeatureSelect={(f) => setSelectedFeature(f)} />
    <div
      ref={mapContainerRef}
      className="mapbox-container"
      style={{ width: "95vw", height: "100vh" }}
    />
    {selectedFeature && (
        <FeatureInfoPanel
          feature={selectedFeature}
          onClose={() => setSelectedFeature(null)}
          onSave={(f) => console.log("Saved:", f)}
        />
      )}
      {mapLoaded && <FloatingLegend map={mapRef.current} />}
    </>
  );
}

// Future improvement: replace hardcoded data: "/file.geojson" with fetch("/api/data?type=fir") once the backend is set up.