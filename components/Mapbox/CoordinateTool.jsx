/**
 * CoordinateTool.jsx
 *
 * While active, each map click shows a popup with the clicked position
 * in both DMS (degrees, minutes, seconds) and DD (decimal degrees).
 */
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

/**
 * Converts decimal degrees to a DMS string, e.g. 1.3625 -> 01°21'45.00"N
 * @param {number} value - Decimal degrees
 * @param {boolean} isLat - True for latitude (N/S, 2-digit degrees), false for longitude (E/W, 3-digit degrees)
 * @returns {string}
 */
function toDMS(value, isLat) {
  const hemisphere = isLat ? (value >= 0 ? "N" : "S") : (value >= 0 ? "E" : "W");
  const abs = Math.abs(value);

  // Work in hundredths of a second so rounding never yields 60.00"
  const totalHundredths = Math.round(abs * 360000);
  const degrees = Math.floor(totalHundredths / 360000);
  const minutes = Math.floor((totalHundredths % 360000) / 6000);
  const seconds = (totalHundredths % 6000) / 100;

  const deg = String(degrees).padStart(isLat ? 2 : 3, "0");
  const min = String(minutes).padStart(2, "0");
  const sec = seconds.toFixed(2).padStart(5, "0");

  return `${deg}°${min}'${sec}"${hemisphere}`;
}

function buildPopupHTML(lat, lng) {
  return `
    <div style="
      background: white;
      border: 3px solid #1e293b;
      border-radius: 10px;
      padding: 10px 14px;
      box-shadow: 0 2px 2px rgba(0, 0, 0, 0.25);
      font-family: 'Inter', sans-serif;
      color: #222;
      min-width: 170px;
      text-align: center;">
      <div style="font-weight: 700; font-size: 0.95em; color: #1e293b;">
        ${toDMS(lat, true)} ${toDMS(lng, false)}
      </div>
      <div style="font-weight: 500; font-size: 0.85em; color: #444; margin-top: 3px;">
        ${lat.toFixed(6)}, ${lng.toFixed(6)}
      </div>
    </div>
  `;
}

export default function CoordinateTool({ map, isActive }) {
  const popupRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const handleClick = (e) => {
      if (!isActive) return;

      const { lat, lng } = e.lngLat.wrap();

      // Replace any open popup (feature or previous coordinate popup)
      if (map.currentPopup) {
        map.currentPopup.remove();
        map.currentPopup = null;
      }

      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        offset: 10,
      })
        .setLngLat(e.lngLat)
        .setHTML(buildPopupHTML(lat, lng))
        .addTo(map);

      map.currentPopup = popup;
      popupRef.current = popup;
    };

    map.on("click", handleClick);

    try {
      if (isActive) {
        map.getCanvas().style.cursor = "crosshair";
      }
    } catch (e) {
      // Map canvas not available, ignore
    }

    return () => {
      try {
        map.off("click", handleClick);
        const canvas = map.getCanvas();
        if (canvas) {
          canvas.style.cursor = "";
        }
      } catch (e) {
        // Map was already removed, ignore
      }
    };
  }, [map, isActive]);

  // Remove the coordinate popup when the tool is switched off
  useEffect(() => {
    if (!isActive && popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
  }, [isActive]);

  return null;
}
