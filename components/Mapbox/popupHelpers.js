import mapboxgl from "mapbox-gl";
import { COLORS } from "./colors";

/**
 * Builds popup HTML dynamically for any GeoJSON feature.
 * Automatically detects suitable color based on layer/category/type.
 */
export function buildPopupHTML(feature) {
  const props = feature.properties || {};
  const name = props.name || props.NAME || "";
  const subtitle = props.subtitle || props.TYPE || props.type || "";
  const category = props.category || props.CATEGORY || "";
  const isFir = props.name?.includes("FIR") || props.NAME?.includes("FIR") || false;
  const isSector = props["fir-label"] ? true : false;
  
  // Determine color based on feature properties
  let color = COLORS.waypoint;  // Default color
  if (props.dme === "true") color = COLORS.waypointDME;
  else if (category === "prohibited") color = COLORS.prohibited;
  else if (category === "restricted") color = COLORS.restricted;
  else if (category === "danger") color = COLORS.danger;
  else if (isFir) color = COLORS.firOutline;
  else if (isSector) color = props["fill-color"] || COLORS.firOutline;

  return `
    <div style="
      background: white;
      border: 3px solid ${color};
      border-radius: 10px;
      padding: 10px 14px;
      box-shadow: 0 2px 2px rgba(0, 0, 0, 0.25);
      font-family: 'Inter', sans-serif;
      color: #222;
      min-width: 120px;
      text-align: center;">
      <div style="font-weight: 700; font-size: 0.95em; color: ${color}; margin-bottom: 3px;">
        ${name}
      </div>
      ${subtitle ? `<div style="font-weight: 500; font-size:0.85em; color:#444;">${subtitle}</div>` : ""}
    </div>
  `;
}

/**
 * Displays a Mapbox popup for any feature + coordinate.
 * Safely closes any previous popup before showing a new one.
 */
export function showPopup(map, feature, lngLat) {
  if (!map || !feature || !lngLat) return;

  // Close previous popup
  if (map.currentPopup) {
    map.currentPopup.remove();
    map.currentPopup = null;
  }

  const popupHTML = buildPopupHTML(feature);

  const popup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: true,
    offset: 10,
  })
    .setLngLat(lngLat)
    .setHTML(popupHTML)
    .addTo(map);

  map.currentPopup = popup;
}
