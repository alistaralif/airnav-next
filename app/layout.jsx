import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";
import Sidebar from "@/components/Sidebar/Sidebar";
import SearchBar from "@/components/SearchBar/SearchBar";
import MapboxContainer from "@/components/Mapbox/MapboxContainer";
import FloatingLegend from "@/components/Mapbox/FloatingLegend";
import { UIProvider } from "@/context/UIContext";
import { MapProvider } from "@/context/MapContext";

export const metadata = {
  title: "Airnav Map",
  description: "Interactive Air Navigation Map built with Next.js and Mapbox",
  favicon: "@/public/airnav_sg.svg",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UIProvider>
          <MapProvider>
            <div className="app-container">
              <Navbar />
              <Sidebar />
              <SearchBar />
              <MapboxContainer />
              <FloatingLegend />
              {children}
            </div>
          </MapProvider>
        </UIProvider>
      </body>
    </html>
  );
}