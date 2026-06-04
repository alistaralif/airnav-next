/**
 * DistanceRing.jsx
 *
 * Controls a single distance ring centered on one airport.
 * Renders a visibility toggle + radius slider; the actual circle is drawn on
 * the map by MapboxContainer, which reads ring state from MapContext. State
 * lives in context (not here) so rings persist when the sidebar panel unmounts.
 */
"use client";

import { useMap } from "@/context/MapContext";
import { RADIUS_VALUES } from "@/components/Mapbox/circleUtils";
import "./DistanceRing.css";

/**
 * Formats a [lng, lat] pair into a readable label, e.g. "1.36°N, 103.99°E".
 */
function formatCenter([lng, lat]) {
  const fmt = (v, pos, neg) => `${Math.abs(v).toFixed(2)}°${v >= 0 ? pos : neg}`;
  return `${fmt(lat, "N", "S")}, ${fmt(lng, "E", "W")}`;
}

/**
 * Splits a "Name (CODE)" label into its name and ICAO code parts so they can be
 * rendered in separate columns. Falls back to the whole label as the name.
 */
function splitLabel(label) {
  const match = label.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return match ? { name: match[1], code: match[2] } : { name: label, code: "" };
}

function DistanceRing({ id, label, center, color }) {
  const { rings, setRingVisible, setRingRadius } = useMap();
  const ring = rings[id] || { radius: 40, visible: false };
  const { name, code } = splitLabel(label);

  // Map the current radius value back to its slider index
  const radiusIndex = RADIUS_VALUES.indexOf(ring.radius);
  const currentIndex = radiusIndex >= 0 ? radiusIndex : 6; // default to 40 NM (index 6)

  const handleSliderChange = (e) => {
    const index = parseInt(e.target.value, 10);
    setRingRadius(id, RADIUS_VALUES[index]);
  };

  return (
    <div className="distance-ring">
      <div className="distance-ring-toggle">
        <input
          type="checkbox"
          id={`ring-${id}-toggle`}
          checked={ring.visible}
          onChange={(e) => setRingVisible(id, e.target.checked)}
        />
        <label htmlFor={`ring-${id}-toggle`}>
          <span className="distance-ring-dot" style={{ background: color }} />
          <span className="distance-ring-name">{name}</span>
          {code && <span className="distance-ring-code">{code}</span>}
        </label>
        {/* <span className="distance-ring-center">{formatCenter(center)}</span> */}
      </div>

      <div className={`distance-ring-slider${!ring.visible ? " disabled" : ""}`}>
        <label htmlFor={`ring-${id}-slider`} className="distance-ring-radius-label">
          Radius: <strong>{ring.radius} NM</strong>
        </label>
        <input
          type="range"
          id={`ring-${id}-slider`}
          min={0}
          max={RADIUS_VALUES.length - 1}
          value={currentIndex}
          onChange={handleSliderChange}
          disabled={!ring.visible}
        />
        <div className="distance-ring-range-labels">
          <span>1 NM</span>
          <span>5000 NM</span>
        </div>
      </div>
    </div>
  );
}

export default DistanceRing;
