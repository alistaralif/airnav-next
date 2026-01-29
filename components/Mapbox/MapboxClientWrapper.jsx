// Dynamically load Mapbox with SSR disabled
// Create a thin wrapper inside the layout, not the map itself.
// ssr: false guarantees:
// - Mapbox code never runs on server
// - process.env.NEXT_PUBLIC_MAPBOX_TOKEN is inlined correctly
// - Mapbox GL initializes only in browser
"use client";

import dynamic from "next/dynamic";

const MapboxContainer = dynamic(
  () => import("./MapboxContainer"),
  { ssr: false }
);

export default function MapboxClientWrapper() {
  return <MapboxContainer />;
}
