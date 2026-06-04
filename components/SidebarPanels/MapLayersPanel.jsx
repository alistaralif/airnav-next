/**
 * MapLayersPanel.jsx
 *
 * Displays toggles for the main dataset layers (FIRs, Navigation Warnings, Waypoints).
 * Each switch controls the corresponding Mapbox layer visibility via MapContext.
 */
"use client";

import { useSession } from "next-auth/react";
import { useMap } from "../../context/MapContext";
import { RADIUS_VALUES } from "@/components/Mapbox/circleUtils";
import "./MapLayersPanel.css";

function MapLayersPanel() {
  const { data: session } = useSession();
  const {
    layerVisibility,
    toggleLayerVisibility,
    getLegends,
    radiusCircle,
    setRadiusCircleVisible,
    setRadiusCircleRadius,
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

  // Find the index of current radius value for the slider
  const radiusIndex = RADIUS_VALUES.indexOf(radiusCircle.radius);
  const currentIndex = radiusIndex >= 0 ? radiusIndex : 6; // default to 50 NM (index 6)

  const handleSliderChange = (e) => {
    const index = parseInt(e.target.value, 10);
    setRadiusCircleRadius(RADIUS_VALUES[index]);
  };

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

      {/* Radius Circle Section */}
      <h4>Distance Ring (WSSS)</h4>
      
      <div className="radius-control">
        <div className="radius-toggle-row">
          <input
            type="checkbox"
            id="radius-circle-toggle"
            checked={radiusCircle.visible}
            onChange={(e) => setRadiusCircleVisible(e.target.checked)}
          />
          <label htmlFor="radius-circle-toggle">
            Show Distance Ring
          </label>
        </div>

        <div className={`radius-slider-section${!radiusCircle.visible ? " disabled" : ""}`}>
          <label htmlFor="radius-slider" className="radius-slider-label">
            Radius: <strong>{radiusCircle.radius} NM</strong>
          </label>
          <input
            type="range"
            id="radius-slider"
            min={0}
            max={RADIUS_VALUES.length - 1}
            value={currentIndex}
            onChange={handleSliderChange}
            disabled={!radiusCircle.visible}
          />
          <div className="radius-range-labels">
            <span>1 NM</span>
            <span>5000 NM</span>
          </div>
        </div>
      </div>

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