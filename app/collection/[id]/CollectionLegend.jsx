"use client";
import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

export default function CollectionLegend({ items = [], visibleTypes = {}, onToggleType }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (items.length === 0) return null;

  const isCircleShape = (label) => {
    const circleTypes = ["Waypoint", "DME Waypoint"];
    return circleTypes.includes(label);
  };

  return (
    <div className={`collection-legend ${isCollapsed ? "collapsed" : ""}`}>
      <div
        className="collection-legend-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span>Legend</span>
        {isCollapsed ? <FaChevronUp /> : <FaChevronDown />}
      </div>
      {!isCollapsed && (
        <div className="collection-legend-content">
          {items.map((item, index) => {
            const isVisible = visibleTypes[item.label] ?? true;
            const isCircle = isCircleShape(item.label);
            return (
              <div
                key={index}
                className={`collection-legend-item ${!isVisible ? "hidden-type" : ""}`}
                onClick={() => onToggleType?.(item.label)}
                title={`Click to ${isVisible ? "hide" : "show"} ${item.label}`}
              >
                <span
                  className={`collection-legend-color ${isCircle ? "circle" : ""}`}
                  style={{ backgroundColor: item.color }}
                />
                <span className="collection-legend-label">{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
