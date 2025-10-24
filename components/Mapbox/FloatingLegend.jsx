/**
 * FloatingLegend.jsx
 *
 * Displays a compact floating legend overlay on the map (bottom-right corner).
 * Automatically updates based on visible layers from MapContext.
 * Only visible when the sidebar is closed.
 */
"use client";

import { useUI } from "@/context/UIContext";
import { useMap } from "@/context/MapContext";

function FloatingLegend() {
  const { isSidebarOpen } = useUI();
  // const { getLegends } = useMap();
  const {
    getLegends,
    layerVisibility,
    categoryVisibility,
    toggleLayerVisibility,
    toggleCategoryVisibility,
  } = useMap();
  

  // Retrieve visible legends from map context
  const legends = getLegends();

  // Hide legend if sidebar is open
  if (isSidebarOpen || legends.length === 0) return null;

  return (
    <div className="floating-legend">
      <div className="legend-header">Legend</div>
      {legends.map((legend, idx) => (
        <div
          key={idx}
          className="legend-item"
          onClick={() => {
            if (legend.category)
              toggleCategoryVisibility(legend.group, legend.category);
            else
              toggleLayerVisibility(legend.group);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "6px",
            cursor: "pointer",
            opacity: legend.category
              ? categoryVisibility?.[legend.group]?.[legend.category] ?? true
                ? 1
                : 0.4
              : layerVisibility[legend.group]
              ? 1
              : 0.4,
            transition: "opacity 0.2s ease",
            paddingLeft: legend.category ? "0px" : "0", // indent sublayers
          }}
          title={
            legend.category
              ? `Click to toggle ${legend.label}`
              : `Click to toggle ${legend.label} layer`
          }
        >
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
  );
}

export default FloatingLegend;
