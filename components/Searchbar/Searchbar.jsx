"use client";

import { useState, useEffect, useRef } from "react";
import { useMap } from "@/context/MapContext";
import { COLORS } from "../Mapbox/colors";
import * as turf from '@turf/turf';
import { showPopup } from "../Mapbox/popupHelpers";


/**
 * SearchBar.jsx
 *
 * Handles live search requests. Backend now returns full GeoJSON Features.
 * Each result object follows the standard format:
 *   { type: "Feature", geometry: {...}, properties: {...} }
 */
export default function SearchBar({ onFeatureSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const suppressSearch = useRef(false);
  const { mapRef } = useMap();
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const itemRefs = useRef([]); // refs to scroll dropdown items


  /** Fetches matching features whenever the query changes. */
  useEffect(() => {
    if (suppressSearch.current) {
      suppressSearch.current = false;
      return;
    }

    // Empty query clears results
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
    
      const map = mapRef.current;
      if (map && map.isStyleLoaded()) {
        removeHighlight();
      }
    
      return;
    }
    

    // Search after a short delay (debounce)
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        // Enrich each feature with a metaType for display
        const enriched = (data.results || []).map((f) => {
          const props = f.properties || {};
          return {
            ...f,
            metaType:
              props.NAME?.includes("FIR") || props.name?.includes("FIR")
                ? "FIR"
                : props.category
                ? "Navigational Warning"
                : f.geometry?.type === "Point"
                ? "Waypoint"
                : props["fir-label"]
                ? props["fir-label"].toUpperCase()
                : props.type === "SID"
                ? "SID"
                : props.type === "STAR"
                ? "STAR"
                : "Feature",
          };
        });
        
        setResults(enriched);
        // setResults(data.results || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Search failed:", err);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  /** Handles keyboard navigation in the dropdown. */
  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;
  
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIndex]);
    }
  };

  /** Scrolls the highlighted item into view. */
  useEffect(() => {
    if (highlightIndex < 0 || !itemRefs.current[highlightIndex]) return;
    itemRefs.current[highlightIndex].scrollIntoView({
      block: "nearest", // ensures minimal scroll
      behavior: "smooth",
    });
  }, [highlightIndex]);  

  /**
   * Centers the map and highlights the selected feature.
   */
  const handleSelect = (feature) => {
    const map = mapRef.current;
    if (!map || !feature) return;

    // Prevents a new fetch after selection
    suppressSearch.current = true;

    // Uses feature.properties.NAME or fallback for display text
    const displayName =
      feature.properties?.NAME ||
      feature.properties?.name ||
      feature.properties?.Ident ||
      "Unnamed Feature";

    setQuery(displayName);
    setResults([]);
    setShowDropdown(false);

    const zoomLevel = feature.geometry.type === "Point" ? 10 :            // waypoints
                        (feature.properties?.type === "SID" || feature.properties?.type === "STAR") ? 7 :  // SIDs/STARs        
                        // feature.geometry.type === "LineString" ? 8 :      // routes
                        feature.properties?.name.toLowerCase().includes('fir') ? 6  :  // FIRs
                        feature.properties["fir-label"] ? 6 :
                        9;   // default for other polygons i.e. NavWarnings


    // Extracts midpoint coordinates depending on geometry type
    let lon, lat;
    
    // For Point, use the coordinates directly
    if (feature.geometry.type === "Point") {
      [lon, lat] = feature.geometry.coordinates;
    } else if (feature.geometry.type === "Polygon") {

      // Calculate the center of the polygon using turf.js
      const center = turf.centroid(feature.geometry);
      [lon, lat] = center.geometry.coordinates;
    } else {

      // For LineString, keep using midpoint
      const coords = feature.geometry.coordinates;
      if (coords.length) {
        const mid = Math.floor(coords.length / 2);
        [lon, lat] = coords[mid];
      }
    }

    // Moves the map and adds highlight
    setTimeout(() => {
      map.flyTo({ center: [lon, lat], zoom: zoomLevel });
    }, 100);  // slight delay for smoother transition
    addHighlight(feature); // uses the feature directly now
    onFeatureSelect?.(feature); // notify parent (MapboxContainer)
  };

    /**
     * Removes all existing highlight layers and its source safely.
     * Must delete every layer referencing the source before deleting the source.
     */
    // const removeHighlight = () => {
    //   const map = mapRef.current;
    //   if (!map) return;

    //   // Lists all known highlight layer IDs used by this app
    //   const highlightLayers = [
    //     "search-highlight",
    //     "search-highlight-fill",
    //     "search-highlight-line",
    //   ];

    //   // Removes any existing popup
    //   if (map.currentPopup) {
    //     map.currentPopup.remove();
    //     map.currentPopup = null;
    //   }      

    //   // Removes each layer if it exists
    //   highlightLayers.forEach((layerId) => {
    //     if (map.getLayer(layerId)) {
    //       try {
    //         map.removeLayer(layerId);
    //       } catch (err) {
    //         console.warn(`Could not remove layer ${layerId}:`, err);
    //       }
    //     }
    //   });

    //   // Removes the source only after all layers referencing it are gone
    //   if (map.getSource("search-highlight")) {
    //     try {
    //       map.removeSource("search-highlight");
    //     } catch (err) {
    //       console.warn("Could not remove source 'search-highlight':", err);
    //     }
    //   }
    // };

    const removeHighlight = () => {
      const map = mapRef.current;
    
      // Early exit if map not ready
      if (!map || !map.isStyleLoaded()) return;
    
      const highlightLayers = [
        "search-highlight",
        "search-highlight-fill",
        "search-highlight-line",
      ];
    
      // Remove popup safely
      if (map.currentPopup) {
        map.currentPopup.remove();
        map.currentPopup = null;
      }
    
      highlightLayers.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          try {
            map.removeLayer(layerId);
          } catch (err) {
            console.warn(`Could not remove layer ${layerId}:`, err);
          }
        }
      });
    
      if (map.getSource("search-highlight")) {
        try {
          map.removeSource("search-highlight");
        } catch (err) {
          console.warn("Could not remove source 'search-highlight':", err);
        }
      }
    };
    
  /**
   * Adds a temporary highlight layer using the full feature object.
   */
  const addHighlight = (feature) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Clears any existing highlight before adding a new one
    removeHighlight();

    map.addSource("search-highlight", {
      type: "geojson",
      data: feature, // full GeoJSON Feature can be used directly
    });

    const type = feature.geometry.type;
    const fillColor = feature.properties?.fill || COLORS.fir;
    // console.log('Feature type:', type, 'Fill color:', fillColor);
    
    // Different styles for Point vs Polygon/LineString
    if (feature.geometry.type === "Point") {
      map.addLayer({
        id: "search-highlight",
        type: "circle",
        source: "search-highlight",
        paint: {
          "circle-color": COLORS.highlight,        // main orange color
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5, 4,
            10, 7,
          ],
          "circle-opacity": 0.9,
        },
      });
    
      // --- Slow, gentle pulse animation (6px ↔ 8px) ---
      let growing = true;
      let radius = 6;
      let animationFrame;
      const step = 0.05;        // small change per frame → slower motion
      const minRadius = 6;
      const maxRadius = 8;
      const delayFrames = 3;    // skip a few frames to smooth speed
      let frameCount = 0;
    
      const animate = () => {
        // verifies the map & layer still exist
        if (!map || !map.getLayer("search-highlight")) return;
    
        frameCount++;
        if (frameCount < delayFrames) {
          animationFrame = requestAnimationFrame(animate);
          return;
        }
        frameCount = 0;
    
        // grows / shrinks slowly within defined limits
        radius += growing ? step : -step;
        if (radius >= maxRadius) growing = false;
        if (radius <= minRadius) growing = true;
    
        try {
          map.setPaintProperty("search-highlight", "circle-radius", radius);
          animationFrame = requestAnimationFrame(animate);
        } catch {
          cancelAnimationFrame(animationFrame);
        }
      };
    
      // starts the animation loop
      animationFrame = requestAnimationFrame(animate);
    
      // stops animation automatically if map or layer removed
      map.once("remove", () => cancelAnimationFrame(animationFrame));
      map.once("styledata", () => {
        if (!map.getLayer("search-highlight")) cancelAnimationFrame(animationFrame);
      });
    } 
    else if (feature.geometry.type === "LineString") {
      // LineString with pulse animation like points
      // Determine color based on feature type
      const featureType = feature.properties?.type;
      let lineColor;
      
      if (featureType === "SID") {
        lineColor = COLORS.sid;
      } else if (featureType === "STAR") {
        lineColor = COLORS.star;
      } else if (featureType === "ATS Route" || featureType === "atsRoute") {
        lineColor = COLORS.atsRoute;
      } else {
        lineColor = feature.properties?.stroke || feature.properties?.["line-color"] || COLORS.highlight;
      }
      
      map.addLayer({
        id: "search-highlight",
        type: "line",
        source: "search-highlight",
        paint: {
          "line-color": lineColor,
          "line-width": 3,
          "line-opacity": 0.9,
        },
      });

      // --- Slow, gentle pulse animation (3px ↔ 5px width) ---
      let growing = true;
      let width = 3;
      let animationFrame;
      const step = 0.05;
      const minWidth = 3;
      const maxWidth = 5;
      const delayFrames = 3;
      let frameCount = 0;

      const animate = () => {
        if (!map || !map.getLayer("search-highlight")) return;

        frameCount++;
        if (frameCount < delayFrames) {
          animationFrame = requestAnimationFrame(animate);
          return;
        }
        frameCount = 0;

        width += growing ? step : -step;
        if (width >= maxWidth) growing = false;
        if (width <= minWidth) growing = true;

        try {
          map.setPaintProperty("search-highlight", "line-width", width);
          animationFrame = requestAnimationFrame(animate);
        } catch {
          cancelAnimationFrame(animationFrame);
        }
      };

      animationFrame = requestAnimationFrame(animate);

      map.once("remove", () => cancelAnimationFrame(animationFrame));
      map.once("styledata", () => {
        if (!map.getLayer("search-highlight")) cancelAnimationFrame(animationFrame);
      });
    }
    else {    // Polygon
      // Add fill layer first (below)
      map.addLayer({
        id: "search-highlight-fill",
        type: "fill",
        source: "search-highlight",
        paint: {
          "fill-color": fillColor,
          "fill-opacity": 0.2
        }
      });

      // Add line layer on top
      map.addLayer({
        id: "search-highlight",
        type: "line",
        source: "search-highlight",
        paint: {
          "line-color": COLORS.highlight,
          "line-width": 2,
        },
      });
    }
  };

  return (
    <div className="searchbar-wrapper">
      <div className="searchbar-box">
        <input
          type="text"
          className="searchbar-input"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          onKeyDown={(e) => handleKeyDown(e)}
        />

        {showDropdown && results.length > 0 && (
          <ul className="search-dropdown">
            {results.map((feature, idx) => (
              <li
                key={idx}
                ref={(el) => (itemRefs.current[idx] = el)}
                onMouseDown={() => handleSelect(feature)}
                style={{
                  backgroundColor: idx === highlightIndex ? "#e9f5ff" : "white",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                {/* Shows a readable label based on available property keys */}
                <strong>
                  {feature.properties?.NAME ||
                   feature.properties?.name ||
                   feature.properties?.Ident ||
                   "Unnamed"}
                </strong>{" "}
                <span style={{ color: "#666", fontSize: "0.8rem" }}>
                  ({feature.metaType})
                  {/* To be fixed */}

                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
