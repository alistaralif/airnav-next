// Displays a vertical navigation bar containing icons representing different pages.
// Each icon triggers a sidebar for the corresponding page when clicked.
"use client";

import { useUI } from "@/context/UIContext";
import { FaLayerGroup } from "react-icons/fa";
import { PiBookmarksSimpleFill } from "react-icons/pi";
import AuthButton from "./AuthButton";
import { TbMapSearch } from "react-icons/tb";


export default function Navbar() {
  const { openSidebar } = useUI();

  // Defines available navigation options with icons and associated page keys.
  const navItems = [
    { icon: <FaLayerGroup />, page: "mapLayers", label: "Map Layers" },
    { icon: <TbMapSearch />, page: "chartSearch", label: "Chart Search" },
    { icon: <PiBookmarksSimpleFill />, page: "customMap", label: "Custom Map" },
  ];

  return (
    <div className="navbar-container">
      {navItems.map((item) => (
        <div
          key={item.page}
          className="nav-item"
          title={item.label}
          onClick={() => openSidebar(item.page)}
          onMouseDown={() => openSidebar(item.page)}
        >
          {item.icon}
        </div>
      ))}
      <div className="nav-spacer" />
      <AuthButton />
      <img className="nav-logo" src="airnav_sg.svg" />
    </div>
  );
}