// Renders a sidebar whose width and content depend on the currently active page.
// Includes an 'X' button for closing and listens for outside clicks to dismiss itself smoothly.
"use client";

import { useState, useEffect, useRef } from "react";
import { useUI } from "@/context/UIContext";
import { FaTimes } from "react-icons/fa";
import useOutsideClick from "@/hooks/useOutsideClick";
import { BsDisplay } from "react-icons/bs";
import MapLayersPanel from "@/components/SidebarPanels/MapLayersPanel.jsx";

// import { map } from "leaflet";

function Sidebar() {
  const { isSidebarOpen, activePage, closeSidebar } = useUI();
  const sidebarRef = useRef(null);

  // Defines width per page for visual variety.
  const widthByPage = {
    mapLayers: "20vw",
    chartSearch: "30vw",
    customMap: "45vw",
  };
  
  // Keeps track of the last known sidebar width to prevent jumpy animations on close
  const [lastWidth, setLastWidth] = useState(widthByPage["mapLayers"]);

  // Closes sidebar when clicking outside of its bounding box.
  useOutsideClick(sidebarRef, () => {
    if (isSidebarOpen) closeSidebar();
  });

  // Determine intended width based on the active page
  const currentWidth = widthByPage[activePage] || lastWidth;

  // Update remembered width only when a valid page is active
  useEffect(() => {
    if (activePage && widthByPage[activePage]) {
      setLastWidth(widthByPage[activePage]);
    }
  }, [activePage]);

  // Determines current sidebar width and transform state.
  // const sidebarStyle = {
  //   width: widthByPage[activePage] || "25vw",
  //   transform: isSidebarOpen ? "translateX(0)" : "translateX(-110%)",
  //   transition: "transform 0.3s ease-in-out",
  // };

  // Sidebar width handling and animation style
  const sidebarStyle = {
    width: currentWidth,
    transform: isSidebarOpen ? "translateX(0)" : "translateX(-110%)",
    transition: "transform 0.35s ease-in-out, width 0.35s ease-in-out",
  };


  // Placeholder content depending on page selection.
  const renderContent = () => {
    switch (activePage) {
      // Replace with components from pages
      case "mapLayers":
        return <MapLayersPanel />;
      case "chartSearch":
        return <p>Chart Search content here</p>;
      case "customMap":
        return <p>Custom Map content here</p>;
      default:
        return null;
    }
  };

  return (
    <div ref={sidebarRef} className="sidebar-container" style={sidebarStyle}>
      {/* Close button at top right corner */}
      <div className="sidebar-close" onClick={closeSidebar}>
        <FaTimes />
      </div>
      {renderContent()}
    </div>
  );
}

export default Sidebar;