"use client";
import React, { useState } from "react";
import "./FeatureInfoPanel.css";
import { PiBookmarkSimpleLight, PiBookmarkSimpleFill } from "react-icons/pi";
import SaveToCollectionModal from "@/components/SaveToCollectionModal/SaveToCollectionModal";
import { useBookmarks } from "@/context/BookmarkContext";

/**
 * Displays metadata of the selected map feature.
 * Appears as a small floating card on top of the map.
 * 
 * Props:
 *  - feature: full GeoJSON feature (with properties & geometry)
 *  - onClose: callback to close panel
 */
export default function FeatureInfoPanel({ feature, onClose }) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const { isFeatureSaved } = useBookmarks();

  if (!feature) return null;

  const props = feature.properties || {};
  const isPoint = feature.geometry?.type === "Point";
  const coords = isPoint ? feature.geometry.coordinates : null;
  const warningType = props?.warning || null;
  const sectorFIR = props?.["fir-label"] || null;

  // Routes
  const isStarSid = props?.type === "SID" || props?.type === "STAR" || null;
  const starsidRunway = props?.runway || null;
  const starsidRoute = props?.route || null;

  // Check if feature is already saved - now reactive to collections changes
  const isSaved = isFeatureSaved(feature);

  /**
   * Formats route string/array into space-separated waypoints
   */
  function formatRoute(route) {
    if (!route) return "";
    try {
      const parsed = typeof route === "string" ? JSON.parse(route) : route;
      return Array.isArray(parsed) ? parsed.join(" - ") : route;
    } catch {
      // Fallback: remove brackets and quotes, replace commas with spaces
      return route.replace(/[\[\]"]/g, "").replace(/,\s*/g, " ");
    }
  }

  return (
    <>
      <div className="feature-info-panel">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>

        <h3 className="feature-title">{props.NAME || props.name || "Unnamed Feature"}</h3>

        {props.subtitle && <h4 className="feature-subtitle">{props.subtitle}</h4>}
        {isStarSid && <h4 className="feature-subtitle">{props.type} - {props.runway}</h4>}

        <hr className="ruler"/>
        
        {warningType && <h5>{warningType} AREA</h5>}
        {sectorFIR && <h5>{sectorFIR.toUpperCase()}</h5>}
        {starsidRoute && (
          <h5 className="feature-route">
            {formatRoute(starsidRoute)}
          </h5>
        )}

        {isPoint && coords && (
          <h5 className="feature-coords">
            {coords[1].toFixed(4)}, {coords[0].toFixed(4)}
          </h5>
        )}

        <div className="feature-actions">
          <button 
            className={`save-btn ${isSaved ? "saved" : ""}`} 
            onClick={() => setShowSaveModal(true)}
            title={isSaved ? "Saved to collection" : "Save to collection"}
          >
            {isSaved ? (
              <PiBookmarkSimpleFill size={20} />
            ) : (
              <PiBookmarkSimpleLight size={20} />
            )}
          </button>
        </div>
      </div>

      {showSaveModal && (
        <SaveToCollectionModal
          feature={feature}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </>
  );
}
