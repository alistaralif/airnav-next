/**
 * SearchBar.jsx
 *
 * Provides a permanent search interface displayed above the map.
 * This component will later integrate with backend search APIs to locate and center map features.
 * Currently, it only logs input for layout verification purposes.
 */
"use client";

import { useState } from "react";
import { IoIosSearch } from "react-icons/io";

function Searchbar() {
  // Local state storing the current text in the search input
  const [query, setQuery] = useState("");

  /**
   * Handles text input updates.
   * @param {Event} e - Input change event.
   */
  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  /**
   * Handles the search action (to be connected with map centering later).
   * Currently logs the entered value for debugging.
   */
  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching for:", query);
  };

  return (
    <div className="searchbar-container">
      {/* The form wrapper ensures keyboard submission compatibility */}
      <form className="searchbar-form" onSubmit={handleSearch}>
        {/* Input box for search queries */}
        <input
          type="text"
          className="searchbar-input"
          placeholder="Search for locations or features..."
          value={query}
          onChange={handleChange}
        />

        {/* Placeholder search button for UI testing */}
        <button type="submit" className="searchbar-button">
          <IoIosSearch />
        </button>
      </form>
    </div>
  );
}

export default Searchbar;
