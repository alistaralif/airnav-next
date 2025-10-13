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
  const { getLegends } = useMap();

  // Retrieve visible legends from map context
  const legends = getLegends();

  // Hide legend if sidebar is open
  if (isSidebarOpen || legends.length === 0) return null;

  return (
    <div className="floating-legend">
      <div className="legend-header">Legend</div>
      {legends.map((legend, idx) => (
        <div key={idx} className="legend-item">
          <div
            className="legend-symbol"
            style={{
              background: legend.color,
              borderRadius: legend.shape === "circle" ? "50%" : "2px",
            }}
          />
          <span className="legend-label">{legend.label}</span>
        </div>
      ))}
    </div>
  );
}

export default FloatingLegend;
