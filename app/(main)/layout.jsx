"use client";

import Navbar from "@/components/Navbar/Navbar";
import Sidebar from "@/components/Sidebar/Sidebar";
import MapboxClientWrapper from "@/components/Mapbox/MapboxClientWrapper";
import { UIProvider } from "@/context/UIContext";
import { MapProvider } from "@/context/MapContext";

export default function MainLayout({ children }) {
  return (
    <UIProvider>
      <MapProvider>
        <div className="app-container">
          <Navbar />
          <Sidebar />
          <MapboxClientWrapper />
          {children}
        </div>
      </MapProvider>
    </UIProvider>
  );
}