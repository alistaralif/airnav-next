/**
 * MapLayersPanel.jsx
 *
 * Displays toggles for the main dataset layers (FIRs, Navigation Warnings, Waypoints).
 * Each switch controls the corresponding Mapbox layer visibility via MapContext.
 */

import { useMap } from "@/context/MapContext";

function MapLayersPanel() {
  const { layerVisibility, toggleLayerVisibility, getLegends } = useMap();

  // Defines user-friendly labels for each layer
  const layerItems = [
    { key: "firs", label: "FIR Boundaries" },
    { key: "navWarnings", label: "Navigation Warnings" },
    { key: "waypoints", label: "Waypoints" },
  ];

  const legends = getLegends();

  return (
    <div className="maplayers-panel">
      {/* Header */}
      <h3 style={{ marginBottom: "10px" }}>Map Layers</h3>

      {/* Layer toggles */}
      {layerItems.map((item) => (
        <div key={item.key} className="layer-toggle">
          <input
            type="checkbox"
            id={item.key}
            checked={layerVisibility[item.key]}
            onChange={() => toggleLayerVisibility(item.key)}
          />
          <label htmlFor={item.key} style={{ marginLeft: "8px" }}>
            {item.label}
          </label>
        </div>
      ))}

      <hr style={{ margin: "15px 0" }} />

      {/* Legend Section */}
      <h4 style={{ marginBottom: "8px" }}>Legend</h4>
      <div className="legend-list">
        {legends.map((legend, idx) => (
          <div key={idx} className="legend-item" style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: legend.shape === "circle" ? "50%" : "2px",
                background: legend.color,
                marginRight: "8px",
                border: "1px solid rgba(0,0,0,0.2)",
              }}
            />
            <span style={{ fontSize: "0.9rem", color: "#333" }}>{legend.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MapLayersPanel;