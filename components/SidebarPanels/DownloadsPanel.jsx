// Displays downloadable GeoJSON datasets as a grid of square cards.
// Dataset URLs come from the map layer configuration.
"use client";

import { useState } from "react";
import { LuFileJson } from "react-icons/lu";
import { LAYERS } from "@/components/Mapbox/layerConfig";
import "./DownloadsPanel.css";

// Builds a download file name from the layer URL, e.g. "/data/SIDs.geojson" -> "SIDs.geojson".
// API-backed layers (e.g. "/api/sectors") fall back to the layer label.
const getFileName = (layer) => {
  const base = layer.url.split("/").pop();
  if (base.endsWith(".geojson")) return base;
  return `${layer.label.replace(/\s+/g, "")}.geojson`;
};

// Display order and names for the download cards, keyed by layer id.
const DOWNLOAD_ITEMS = [
  { id: "firs-fill", label: "FIRs" },
  { id: "sectors-fill", label: "Sectors" },
  { id: "navWarnings-fill", label: "Navigational Warnings" },
  { id: "atsRoutes", label: "ATS Routes" },
  { id: "stars", label: "STARs" },
  { id: "sids", label: "SIDs" },
  { id: "waypoints", label: "Waypoints" },
];

const DOWNLOADS = DOWNLOAD_ITEMS.map(({ id, label }) => {
  const layer = LAYERS.find((l) => l.id === id);
  return { id, label, url: layer.url, fileName: getFileName(layer) };
});

export default function DownloadsPanel() {
  const [downloading, setDownloading] = useState(null);

  // Fetches the dataset and triggers a browser download.
  // Sectors go through the API so Singapore sectors stay gated behind login.
  const handleDownload = async (item) => {
    setDownloading(item.id);
    try {
      const response = await fetch(item.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = item.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);

      // Records the download server-side; tracking failures never block the user.
      fetch("/api/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset: item.id }),
        keepalive: true,
      }).catch(() => {});
    } catch (error) {
      console.error(`❌ Failed to download ${item.fileName}:`, error);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="downloads-panel">
      <h3>Downloads</h3>
      <p className="panel-description">Download map data as GeoJSON files</p>

      <div className="downloads-grid">
        {DOWNLOADS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="download-card"
            title={`Download ${item.fileName}`}
            onClick={() => handleDownload(item)}
            disabled={downloading === item.id}
          >
            <LuFileJson className="download-card-icon" />
            <span className="download-card-name">
              {downloading === item.id ? "Downloading..." : item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
