// Handles the global user interface state for sidebar visibility and active page selection.
// Provides context methods for opening, closing, and switching between sidebar panels.
"use client";

import { createContext, useContext, useState } from "react";

const UIContext = createContext();

export function UIProvider({ children }) {
  // Tracks which page (panel) is active: "mapLayers", "chartSearch", "customMap", etc.
  const [activePage, setActivePage] = useState(null);

  // Controls whether the sidebar is visible on the screen.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Opens the sidebar for a given page.
  const openSidebar = (pageName) => {
    setActivePage(pageName);
    setIsSidebarOpen(true);
  };

  // Closes the sidebar and resets active page.
  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setActivePage(null);
  };

  return (
    <UIContext.Provider
      value={{ activePage, isSidebarOpen, openSidebar, closeSidebar }}
    >
      {children}
    </UIContext.Provider>
  );
}

// Custom hook for other components to access UI state and actions.
export const useUI = () => useContext(UIContext);
