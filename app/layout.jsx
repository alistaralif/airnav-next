import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";
import Sidebar from "@/components/Sidebar/Sidebar";
// import MapboxContainer from "@/components/Mapbox/MapboxContainer"; // Next.js 16 SSR incompatible
import MapboxClientWrapper from "@/components/Mapbox/MapboxClientWrapper";
import { UIProvider } from "@/context/UIContext";
import { MapProvider } from "@/context/MapContext";
import AuthProvider from "@/context/AuthProvider";

export const metadata = {
  title: "Airnav Map",
  description: "Interactive Air Navigation Map built with Next.js and Mapbox",
  icons: {
    icon: "/airnav_sg.svg",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
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
        </AuthProvider>
      </body>
    </html>
  );
}