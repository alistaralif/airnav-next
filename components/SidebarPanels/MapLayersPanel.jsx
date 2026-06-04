/**
 * MapLayersPanel.jsx
 *
 * Displays toggles for the main dataset layers (FIRs, Navigation Warnings, Waypoints).
 * Each switch controls the corresponding Mapbox layer visibility via MapContext.
 */
"use client";

import { useSession } from "next-auth/react";
import { useMap } from "../../context/MapContext";
import { DISTANCE_RINGS } from "@/components/Mapbox/circleUtils";
import DistanceRing from "./DistanceRing";
import "./MapLayersPanel.css";

function MapLayersPanel() {
  const { data: session } = useSession();
  const {
    layerVisibility,
    toggleLayerVisibility,
    getLegends,
  } = useMap();

  // Defines user-friendly labels for each layer
  const layerItems = [
    { key: "firs", label: "FIRs" },
    { key: "sectors", label: "Sectors" },
    { key: "navWarnings", label: "Navigation Warnings" },
    { key: "atsRoutes", label: "ATS Routes" },
    { key: "sids", label: "SIDs" },
    { key: "stars", label: "STARs" },
    { key: "waypoints", label: "Waypoints" },
  ];

  // Filter legends to hide Singapore for unauthorized users
  const legends = getLegends().filter((legend) => {
    if (!session?.user && legend.category === "Singapore") {
      return false;
    }
    return true;
  });

  return (
    <div className="maplayers-panel">
      {/* Header */}
      <h3>Map Layers</h3>

      {/* Layer toggles */}
      {layerItems.map((item) => (
        <div key={item.key} className="layer-toggle">
          <input
            type="checkbox"
            id={item.key}
            checked={!!layerVisibility[item.key]}
            onChange={() => toggleLayerVisibility(item.key)}
          />
          <label htmlFor={item.key}>
            {item.label}
          </label>
        </div>
      ))}

      <hr />

      {/* Distance Rings Section: one ring control per airport center */}
      <h4>Distance Rings</h4>

      {DISTANCE_RINGS.map((ring) => (
        <DistanceRing
          key={ring.id}
          id={ring.id}
          label={ring.label}
          center={ring.center}
          color={ring.color}
        />
      ))}

      <hr />

      {/* Legend Section */}
      <h4>Legend</h4>
      <div className="legend-list">
        {legends.map((legend, idx) => (
          <div key={idx} className="legend-item">
            {legend.flag ? (
              <span className="legend-flag">{legend.flag}</span>
            ) : (
              <div
                className="legend-color-swatch"
                style={{
                  borderRadius: legend.shape === "circle" ? "50%" : "2px",
                  background: legend.color,
                }}
              />
            )}
            <span className="legend-label">{legend.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MapLayersPanel;