import React from "react";
import "./FeatureInfoPanel.css";

/**
 * Displays metadata of the selected map feature.
 * Appears as a small floating card on top of the map.
 * 
 * Props:
 *  - feature: full GeoJSON feature (with properties & geometry)
 *  - onClose: callback to close panel
 *  - onSave: optional callback for saving to user’s custom map
 */
export default function FeatureInfoPanel({ feature, onClose, onSave }) {
  if (!feature) return null;

  const props = feature.properties || {};
  const isPoint = feature.geometry?.type === "Point";
  const coords = isPoint ? feature.geometry.coordinates : null;

  return (
    <div className="feature-info-panel">
      <button className="close-btn" onClick={onClose}>
        ×
      </button>

      <h3 className="feature-title">{props.NAME || props.name || "Unnamed Feature"}</h3>

      {props.subtitle && <p className="feature-subtitle">{props.subtitle}</p>}

      {/* Generic list of all other properties */}
      <ul className="feature-props">
        {Object.entries(props)
          .filter(([key]) => !["NAME", "name", "subtitle"].includes(key))
          .map(([key, value]) => (
            <li key={key}>
              <strong>{key}: </strong>
              <span>{String(value)}</span>
            </li>
          ))}
      </ul>

      {isPoint && coords && (
        <p className="feature-coords">
          Coordinates: {coords[1].toFixed(4)}, {coords[0].toFixed(4)}
        </p>
      )}

      <div className="feature-actions">
        <button className="save-btn" onClick={() => onSave?.(feature)}>
          Save to Custom Map
        </button>
      </div>
    </div>
  );
}
