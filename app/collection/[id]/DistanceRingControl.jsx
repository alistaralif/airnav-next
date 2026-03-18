"use client";
import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { TbCircleDashed } from "react-icons/tb";
import { RADIUS_VALUES } from "@/components/Mapbox/circleUtils";

export default function DistanceRingControl({ 
  visible, 
  radius, 
  onToggleVisible, 
  onRadiusChange 
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const radiusIndex = RADIUS_VALUES.indexOf(radius);
  const currentIndex = radiusIndex >= 0 ? radiusIndex : 6; // Default to 40NM

  const handleSliderChange = (e) => {
    const index = parseInt(e.target.value, 10);
    onRadiusChange(RADIUS_VALUES[index]);
  };

  return (
    <div className={`distance-ring-control ${isCollapsed ? "collapsed" : ""}`}>
      <div
        className="distance-ring-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="distance-ring-title">
          <TbCircleDashed size={16} />
          <span>Distance Ring</span>
        </div>
        {isCollapsed ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
      </div>
      
      {!isCollapsed && (
        <div className="distance-ring-content">
          <div className="distance-ring-toggle">
            <input
              type="checkbox"
              id="distance-ring-visible"
              checked={visible}
              onChange={(e) => onToggleVisible(e.target.checked)}
            />
            <label htmlFor="distance-ring-visible">Show Ring (WSSS)</label>
          </div>

          <div className={`distance-ring-slider ${!visible ? "disabled" : ""}`}>
            <label className="slider-label">
              Radius: <strong>{radius} NM</strong>
            </label>
            <input
              type="range"
              min={0}
              max={RADIUS_VALUES.length - 1}
              value={currentIndex}
              onChange={handleSliderChange}
              disabled={!visible}
            />
            <div className="slider-range">
              <span>1 NM</span>
              <span>5000 NM</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
