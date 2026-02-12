"use client";

import { useState, useEffect, useRef } from "react";
import "./ChartSearchPanel.css";
import { MdManageSearch } from "react-icons/md";
import { PiMapPinArea, PiMapPinSimpleArea, PiLineSegments } from "react-icons/pi";
import { PiFilePdf, PiCopy, PiCopyFill } from "react-icons/pi";

export default function ChartSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [expandedRoute, setExpandedRoute] = useState(null); // Track expanded route
  const [expandedAirspace, setExpandedAirspace] = useState(null); // Track expanded airspace
  const [copiedId, setCopiedId] = useState(null); // Track which item was copied
  const itemRefs = useRef([]);
  const isSelectingRef = useRef(false);
  const suppressSuggestionsRef = useRef(false);

  /**
   * Enriches feature with metaType for display (same logic as Searchbar)
   */
  const enrichFeature = (feature) => {
    const props = feature.properties || {};
    return {
      ...feature,
      metaType:
        props.NAME?.includes("FIR") || props.name?.includes("FIR")
          ? "FIR"
          : props.category
          ? "Navigational Warning"
          : feature.geometry?.type === "Point"
          ? "Waypoint"
          : props["fir-label"]
          ? props["fir-label"].toUpperCase()
          : props.type === "SID"
          ? "SID"
          : props.type === "STAR"
          ? "STAR"
          : props.type === "ATS Route"
          ? "ATS Route"
          : "Feature",
    };
  };

  /**
   * Formats route string/array into space-separated waypoints
   */
  const formatRoute = (route) => {
    if (!route) return "";
    try {
      const parsed = typeof route === "string" ? JSON.parse(route) : route;
      return Array.isArray(parsed) ? parsed.join(" → ") : route;
    } catch {
      return route.replace(/[\[\]"]/g, "").replace(/,\s*/g, " → ");
    }
  };

  // Fetch suggestions as user types
  useEffect(() => {
    if (suppressSuggestionsRef.current) {
      suppressSuggestionsRef.current = false;
      return;
    }

    if (!query.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        // Enrich suggestions with metaType
        const enriched = (data.results || []).map(enrichFeature);
        setSuggestions(enriched);
        setShowDropdown(true);
      } catch (err) {
        console.error("Search failed:", err);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  // Handle search submission
  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setShowDropdown(false);
    setResults(null);
    setExpandedRoute(null); // Reset expanded route on new search

    try {
      // Fetch feature data
      const featureRes = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
      const featureData = await featureRes.json();

      // Fetch available charts
      const chartRes = await fetch(`/api/charts?query=${encodeURIComponent(searchQuery)}`);
      const chartData = await chartRes.json();

      // Process and organize results - enrich all features
      const features = (featureData.results || []).map(enrichFeature);
      const charts = chartData.charts || [];

      // Categorize features
      const waypoints = features.filter(f => f.geometry?.type === "Point");
      const routes = features.filter(f => 
        f.properties?.type === "SID" || 
        f.properties?.type === "STAR" || 
        f.properties?.type === "ATS Route"
      );
      const airspaces = features.filter(f => 
        f.geometry?.type === "Polygon" && 
        !routes.includes(f)
      );

      setResults({
        query: searchQuery,
        waypoints,
        routes,
        airspaces,
        charts,
      });
    } catch (err) {
      console.error("Chart search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === "Enter") {
        handleSearch();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0) {
        const selected = suggestions[highlightIndex];
        const name = selected.properties?.NAME || selected.properties?.name || selected.properties?.Ident || "";
        setQuery(name);
        handleSearch(name);
      } else {
        handleSearch();
      }
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && itemRefs.current[highlightIndex]) {
      itemRefs.current[highlightIndex].scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightIndex]);

  // Handle blur - only close if not selecting
  const handleBlur = () => {
    setTimeout(() => {
      if (!isSelectingRef.current) {
        setShowDropdown(false);
      }
      isSelectingRef.current = false;
    }, 150);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (feature) => {
    const name = feature.properties?.NAME || feature.properties?.name || feature.properties?.Ident || "";
    suppressSuggestionsRef.current = true;
    setQuery(name);
    setSuggestions([]);
    setShowDropdown(false);
    isSelectingRef.current = false;
    handleSearch(name);
  };

  // Toggle route expansion
  const handleRouteClick = (route, idx) => {
    if (expandedRoute === idx) {
      setExpandedRoute(null); // Collapse if already expanded
    } else {
      setExpandedRoute(idx); // Expand this route
    }
  };

  // Toggle airspace expansion
  const handleAirspaceClick = (airspace, idx) => {
    if (expandedAirspace === idx) {
      setExpandedAirspace(null); // Collapse if already expanded
    } else {
      setExpandedAirspace(idx); // Expand this airspace
    }
  };

  // Format coordinates for display
  const formatCoordinates = (coords) => {
    if (!coords || coords.length < 2) return "N/A";
    const [lon, lat] = coords;
    const latDir = lat >= 0 ? "N" : "S";
    const lonDir = lon >= 0 ? "E" : "W";
    return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
  };

  // Copy GeoJSON to clipboard
  const copyGeoJSON = (feature, id) => {
    const geoJSON = JSON.stringify(feature, null, 2);
    navigator.clipboard.writeText(geoJSON).then(() => {
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    });
  };

  return (
    <div className="chart-search-panel">
      <h3>Chart Search</h3>
      <p className="panel-description">
        Get data and charts for FIRs, warnings, waypoints, sectors, SIDs, STARs, ATS routes, and airspaces
      </p>

      {/* Search Input */}
      <div className="chart-search-wrapper">
        <div className="chart-search-box">
          <input
            type="text"
            className="chart-search-input"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            onFocus={() => suggestions.length && setShowDropdown(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
          <button 
            className="chart-search-btn"
            onClick={() => handleSearch()}
            disabled={loading}
          >
            {loading ? "..." : <MdManageSearch />}
          </button>
        </div>

        {/* Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <ul className="chart-search-dropdown">
            {suggestions.slice(0, 10).map((feature, idx) => (
              <li
                key={idx}
                ref={(el) => (itemRefs.current[idx] = el)}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur
                  e.stopPropagation(); // Stop event bubbling
                  isSelectingRef.current = true;
                }}
                onClick={(e) => {
                  e.stopPropagation(); // Stop event bubbling to parent
                  handleSelectSuggestion(feature);
                }}
                className={idx === highlightIndex ? "highlighted" : ""}
              >
                <strong>
                  {feature.properties?.NAME ||
                   feature.properties?.name ||
                   feature.properties?.Ident ||
                   "Unnamed"}
                </strong>
                <span className={`suggestion-type ${feature.metaType?.toLowerCase().replace(/\s+/g, '-')}`}>
                  {feature.metaType}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="chart-loading">
          <div className="spinner"></div>
          <span>Searching...</span>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div className="chart-results">
          <h4>Results for "{results.query}"</h4>

          {/* Coordinates Box */}
          {results.waypoints.length > 0 && (
            <div className="result-box coordinates-box">
              <div className="box-header">
                <span className="box-icon"><PiMapPinSimpleArea/></span>
                <span className="box-title">Coordinates</span>
                <span className="box-count">{results.waypoints.length}</span>
              </div>
              <div className="box-content">
                {results.waypoints.map((wp, idx) => (
                  <div key={idx} className="coordinate-item">
                    <span className="coord-name">
                      {wp.properties?.Ident || wp.properties?.name || "Unknown"}
                    </span>
                    <span className="coord-value">
                      {formatCoordinates(wp.geometry?.coordinates)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Routes Box */}
          {results.routes.length > 0 && (
            <div className="result-box routes-box">
              <div className="box-header">
                <span className="box-icon"><PiLineSegments /></span>
                <span className="box-title">Routes</span>
                <span className="box-count">{results.routes.length}</span>
              </div>
              <div className="box-content">
                {results.routes.map((route, idx) => (
                  <div key={idx} className="route-item-wrapper">
                    <div 
                      className={`route-item ${expandedRoute === idx ? 'expanded' : ''}`}
                      onClick={() => handleRouteClick(route, idx)}
                    >
                      <span className="route-name">
                        {route.properties?.NAME || route.properties?.name || "Unknown Route"}
                      </span>
                      <span className={`route-type ${route.properties?.type?.toLowerCase().replace(/\s+/g, '-')}`}>
                        {route.properties?.type || "Route"}
                      </span>
                      <span className="route-expand-icon">
                        {expandedRoute === idx ? "▼" : "▶"}
                      </span>
                    </div>
                    
                    {/* Expanded Route Details */}
                    {expandedRoute === idx && (
                      <div className="route-details">
                        <div className="route-detail-row">
                          <span className="detail-label">Type</span>
                          <span className="detail-value">{route.properties?.type || "N/A"}</span>
                        </div>
                        
                        {route.properties?.runway && (
                          <div className="route-detail-row">
                            <span className="detail-label">Runway</span>
                            <span className="detail-value">{route.properties.runway}</span>
                          </div>
                        )}
                        
                        {route.properties?.route && (
                          <div className="route-detail-row route-waypoints">
                            <span className="detail-label">Route</span>
                            <span className="detail-value route-sequence">
                              {formatRoute(route.properties.route)}
                            </span>
                          </div>
                        )}

                        {route.properties?.["fir-label"] && (
                          <div className="route-detail-row">
                            <span className="detail-label">FIR</span>
                            <span className="detail-value">
                              {route.properties["fir-label"].toUpperCase()}
                            </span>
                          </div>
                        )}

                        {route.properties?.airport && (
                          <div className="route-detail-row">
                            <span className="detail-label">Airport</span>
                            <span className="detail-value">{route.properties.airport}</span>
                          </div>
                        )}

                        {/* GeoJSON Section */}
                        <div className="geojson-section">
                          <div className="geojson-header">
                            <span className="detail-label">GeoJSON</span>
                            <button 
                              className="copy-geojson-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyGeoJSON(route, `route-${idx}`);
                              }}
                            >
                              {copiedId === `route-${idx}` ? <PiCopyFill /> : <PiCopy />}
                            </button>
                          </div>
                          <pre className="geojson-display">
                            {JSON.stringify(route, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Airspaces Box */}
          {results.airspaces.length > 0 && (
            <div className="result-box airspaces-box">
              <div className="box-header">
                <span className="box-icon"><PiMapPinArea /></span>
                <span className="box-title">Airspaces</span>
                <span className="box-count">{results.airspaces.length}</span>
              </div>
              <div className="box-content">
                {results.airspaces.map((airspace, idx) => (
                  <div key={idx} className="airspace-item-wrapper">
                    <div 
                      className={`airspace-item ${expandedAirspace === idx ? 'expanded' : ''}`}
                      onClick={() => handleAirspaceClick(airspace, idx)}
                    >
                      <span className="airspace-name">
                        {airspace.properties?.NAME || airspace.properties?.name || "Unknown"}
                      </span>
                      <span className="airspace-type">{airspace.metaType}</span>
                      <span className="airspace-expand-icon">
                        {expandedAirspace === idx ? "▼" : "▶"}
                      </span>
                    </div>
                    
                    {/* Expanded Airspace Details */}
                    {expandedAirspace === idx && (
                      <div className="airspace-details">
                        {/* Properties Section */}
                        {airspace.properties?.["fir-label"] && (
                          <div className="airspace-detail-row">
                            <span className="detail-label">FIR</span>
                            <span className="detail-value">
                              {airspace.properties["fir-label"].toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        {airspace.properties?.class && (
                          <div className="airspace-detail-row">
                            <span className="detail-label">Class</span>
                            <span className="detail-value">{airspace.properties.class}</span>
                          </div>
                        )}

                        {airspace.properties?.lower_limit && (
                          <div className="airspace-detail-row">
                            <span className="detail-label">Lower Limit</span>
                            <span className="detail-value">{airspace.properties.lower_limit}</span>
                          </div>
                        )}

                        {airspace.properties?.upper_limit && (
                          <div className="airspace-detail-row">
                            <span className="detail-label">Upper Limit</span>
                            <span className="detail-value">{airspace.properties.upper_limit}</span>
                          </div>
                        )}

                        {airspace.properties?.category && (
                          <div className="airspace-detail-row">
                            <span className="detail-label">Category</span>
                            <span className="detail-value">{airspace.properties.category}</span>
                          </div>
                        )}

                        {/* GeoJSON Section */}
                        <div className="geojson-section">
                          <div className="geojson-header">
                            <span className="detail-label">GeoJSON</span>
                            <button 
                              className="copy-geojson-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyGeoJSON(airspace, `airspace-${idx}`);
                              }}
                            >
                                {copiedId === `airspace-${idx}` ? <PiCopyFill /> : <PiCopy />}
                              </button>
                          </div>
                          <pre className="geojson-display">
                            {JSON.stringify(airspace, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts Box */}
          {results.charts.length > 0 && (
            <div className="result-box charts-box">
              <div className="box-header">
                <span className="box-icon"><PiFilePdf/></span>
                <span className="box-title">Available Charts</span>
                <span className="box-count">{results.charts.length}</span>
              </div>
              <div className="box-content">
                {results.charts.map((chart, idx) => (
                  <div key={idx} className="chart-item">
                    <div className="chart-preview">
                      <iframe
                        src={`${chart.url}#toolbar=0&navpanes=0`}
                        title={chart.name}
                        className="pdf-preview"
                      />
                    </div>
                    <div className="chart-info">
                      <span className="chart-name">{chart.name}</span>
                      <a 
                        href={chart.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="chart-download"
                      >
                        Open PDF ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {results.waypoints.length === 0 && 
           results.routes.length === 0 && 
           results.airspaces.length === 0 && 
           results.charts.length === 0 && (
            <div className="no-results">
              <span>No results found for "{results.query}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}