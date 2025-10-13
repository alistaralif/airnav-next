// Displays a vertical navigation bar containing icons representing different pages.
// Each icon triggers a sidebar for the corresponding page when clicked.
"use client";

import { useUI } from "@/context/UIContext";
import { FaLayerGroup, FaChartBar, FaMapMarkedAlt } from "react-icons/fa";

function Navbar() {
  const { openSidebar } = useUI();

  // Defines available navigation options with icons and associated page keys.
  const navItems = [
    { icon: <FaLayerGroup />, page: "mapLayers", label: "Map Layers" },
    { icon: <FaChartBar />, page: "chartSearch", label: "Chart Search" },
    { icon: <FaMapMarkedAlt />, page: "customMap", label: "Custom Map" },
  ];

  return (
    <div className="navbar-container">
      {navItems.map((item) => (
        <div
          key={item.page}
          className="nav-item"
          title={item.label}
          onClick={() => openSidebar(item.page)}
        >
          {item.icon}
        </div>
        
      ))}
      <img className="nav-logo" src="airnav_sg.svg"/>
    </div>
  );
}

export default Navbar;
