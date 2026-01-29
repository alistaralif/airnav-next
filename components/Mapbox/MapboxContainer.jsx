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
import { createCircleGeoJSON, WSSS_COORDS } from "./circleUtils";

// Mapbox public token for rendering the map
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Mapbox style to be used
const MAP_STYLE = "mapbox://styles/mapbox/light-v11";

export default function MapboxContainer() {
  // Stores map instance and container reference
  const mapRef = useRef(null);  // Actual Mapbox map instance
  const mapContainerRef = useRef(null);   // HTML container for the map
  const [mapLoaded, setMapLoaded] = useState(false);  // Tracks if map has finished loading
  const { setMapInstance, radiusCircle } = useMap();  // Context method to expose map instance to the context for access in other components globally
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
    map.on("load", async () => {
// Load each layer from the LAYERS configuration
      for (const layer of LAYERS) {
        try {
          console.log(`Fetching: ${layer.url}`);
          const response = await fetch(layer.url);
          
          if (!response.ok) {
            console.error(`❌ Failed to fetch ${layer.url}: ${response.status}`);
            continue;
          }
    
          const contentType = response.headers.get("content-type");
          if (!contentType?.includes("application/json") && !contentType?.includes("application/geo+json")) {
            console.error(`❌ Wrong content type for ${layer.url}: ${contentType}`);
            continue;
          }
    
          const data = await response.json();
          console.log(`✅ Loaded ${layer.id}:`, data.features?.length, "features");
    
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

          // Add hit area layer for easier clicking on thin lines
          if (layer.hitArea) {
            map.addLayer({
              id: layer.hitArea.id,
              type: layer.hitArea.type,
              source: layer.id,
              paint: layer.hitArea.paint,
              layout: layer.layout || {},
            });

            // Add click handler for hit area
            map.on("click", layer.hitArea.id, (e) => {
              const feature = e.features[0];
              showPopup(map, feature, e.lngLat);
              setSelectedFeature(feature);
            });

            // Change cursor on hover for hit area
            map.on("mouseenter", layer.hitArea.id, () => {
              map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", layer.hitArea.id, () => {
              map.getCanvas().style.cursor = "";
            });
          }
      
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
          
          
          map.on("click", layer.id, (e) => {
            const feature = e.features[0];
            const coords =
              layer.id === "waypoints"
                ? feature.geometry.coordinates.slice()
                : e.lngLat;
      
            showPopup(map, feature, coords);
            setSelectedFeature(feature);
          });
        } catch (error) {
          console.error(`❌ Error loading ${layer.id}:`, error);
        }
      }

      // Popup on highlight layer
      map.on("click", "search-highlight", (e) => {
        const feature = e.features[0];
        if (!feature) return;
      
        const coords =
          feature.geometry.type === "Point"
            ? feature.geometry.coordinates
            : e.lngLat;
      
        showPopup(map, feature, coords);
        setSelectedFeature(feature);
      });
      
      map.on("click", "search-highlight-fill", (e) => {
        const feature = e.features[0];
        if (!feature) return;
      
        const coords =
          feature.geometry.type === "Point"
            ? feature.geometry.coordinates
            : e.lngLat;
      
        showPopup(map, feature, coords);
        setSelectedFeature(feature);
      });
      
      setMapLoaded(true);   // Mark map as loaded after all layers are added
    });

    // Assign map instance reference for global control
    mapRef.current = map;

    // Cleanup on unmount
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Effect to update radius circle when radius or visibility changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const sourceId = "radius-circle-source";
    const layerId = "radius-circle";
    const outlineLayerId = "radius-circle-outline";

    // Create or update the circle
    const circleGeoJSON = createCircleGeoJSON(WSSS_COORDS, radiusCircle.radius);

    if (map.getSource(sourceId)) {
      // Update existing source
      map.getSource(sourceId).setData(circleGeoJSON);
    } else {
      // Add new source and layers
      map.addSource(sourceId, {
        type: "geojson",
        data: circleGeoJSON,
      });

      map.addLayer({
        id: layerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color":"rgb(59, 130, 246)",
          "fill-opacity": 0.06,
        },
        layout: {
          visibility: radiusCircle.visible ? "visible" : "none",
        },
      });

      map.addLayer({
        id: outlineLayerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color":"rgb(59, 130, 246)",
          "line-width": 2,
          "line-dasharray": [],
        },
        layout: {
          visibility: radiusCircle.visible ? "visible" : "none",
        },
      });
    }

    // Update visibility
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(
        layerId,
        "visibility",
        radiusCircle.visible ? "visible" : "none"
      );
      map.setLayoutProperty(
        outlineLayerId,
        "visibility",
        radiusCircle.visible ? "visible" : "none"
      );
    }
  }, [radiusCircle.radius, radiusCircle.visible]);

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
