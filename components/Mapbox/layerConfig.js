import { COLORS } from "./colors";

// Standard paint styles
const paintStyles = {
    outlineWidth: 1.2,
    fillOpacityLight: 0.08,
    fillOpacity: 0.35,
  }

// Layer visibility defaults
export const VISIBILITY = {
    firs: "visible",
    navWarnings: "none",
    waypoints: "none",
    sids: "none",
    stars: "none",
    atsRoutes: "none",
  };
  
// Layers configuration
export const LAYERS = [
  {
    id: "firs-fill",
    group: "firs",
    label: "FIRs",
    url: "/data/FIRs.geojson",
    type: "fill",
    paint: {
      "fill-color": COLORS.fir,
      "fill-opacity": paintStyles.fillOpacityLight,
    },
    layout: { visibility: VISIBILITY.firs },
    outline: {
      id: "firs-outline",
      group: "firs",
      type: "line",
      paint: {
        "line-color": COLORS.firOutline,
        "line-width": paintStyles.outlineWidth,
      },
      layout: { visibility: VISIBILITY.firs },
    },
  },
  {
    id: "navWarnings-fill",
    group: "navWarnings",
    label: "Nav Warnings",
    url: "/data/NavWarnings.geojson",
    type: "fill",
    categoryField: "category",  //  used by MapContext to filter geojson features
    sublayers: [
      { key: "prohibited", label: "Prohibited Area", color: COLORS.prohibited },
      { key: "restricted", label: "Restricted Area", color: COLORS.restricted },
      { key: "danger",     label: "Danger Area",     color: COLORS.danger },
    ],
    paint: {
      "fill-color": [
        "match",
        ["get", "category"],
        "prohibited", COLORS.prohibited,
        "restricted", COLORS.restricted,
        "danger",     COLORS.danger,
        "#cccccc",
      ],
      "fill-opacity": paintStyles.fillOpacity,
    },
    layout: { visibility: VISIBILITY.navWarnings },
    outline: {
      id: "navWarnings-outline",
      group: "navWarnings",
      type: "line",
      paint: {
        "line-color": [
          "match",
          ["get", "category"],
          "prohibited", COLORS.prohibited,
          "restricted", COLORS.restricted,
          "danger",     COLORS.danger,
          "#cccccc",
        ],
        "line-width": paintStyles.outlineWidth,
      },
      layout: { visibility: VISIBILITY.navWarnings },
    },
  },
  {
    id: "sectors-fill",
    group: "sectors",
    label: "Sectors",
    url: "/api/sectors",  // Changed from /data/Sectors.geojson
    type: "fill",
    categoryField: "fir",   // used by MapContext to filter geojson features
    sublayers: [
      { key: "Singapore", label: "Singapore Sectors", flag: "🇸🇬" },
      { key: "Kuala Lumpur", label: "Kuala Lumpur Sectors", flag: "🇲🇾" },
      { key: "Jakarta", label: "Jakarta Sectors", flag: "🇮🇩" },
      { key: "Ujung Pandang", label: "Ujung Pandang Sectors", flag: "🇮🇩" },
      { key: "Bangkok", label: "Bangkok Sectors", flag: "🇹🇭" },
      { key: "Ho Chi Minh", label: "Ho Chi Minh Sectors", flag: "🇻🇳" },
    ],
    paint: {
      "fill-color": [
        "coalesce",
        ["get", "fill-color"],
        COLORS.firOutline],
      "fill-opacity": paintStyles.fillOpacity,
    },
    layout: { visibility: "none" },
    outline: {
      id: "sectors-outline",
      group: "sectors",
      type: "line",
      paint: {
        "line-color": 
        // COLORS.firOutline,
        [
          "coalesce",
          ["get", "fill-color"],
          COLORS.firOutline],
        "line-width": paintStyles.outlineWidth,
      },
      layout: { visibility: "none" },
    },  
  },  
  {
    id: "waypoints",
    group: "waypoints",
    label: "Waypoints",
    url: "/data/Waypoints.geojson",
    type: "circle",
    categoryField: "dme",  // used by MapContext to filter geojson features
    sublayers: [
      { key: "true",  label: "DME Waypoint",    color: COLORS.waypointDME },
      { key: "false", label: "Waypoint", color: COLORS.waypoint },
    ],
    paint: {
          "circle-color": [
            "match",
            ["get", "dme"],
            "false",
            COLORS.waypoint,
            "true",
            COLORS.waypointDME,
            "#cccccc",
          ],
          "circle-radius": 4,
          "circle-stroke-width": 1,
          "circle-stroke-color": COLORS.waypoint,
    },
    layout: { visibility: VISIBILITY.waypoints },
  },
  {
    id: "sids",
    group: "sids",
    label: "SIDs",
    url: "/data/SIDs.geojson",
    type: "line",
    categoryField: "runway",  // used by MapContext to filter geojson features
    sublayers: [
      { key: "RWY 02L", label: "RWY 02L SIDs", color: COLORS.sid },
      { key: "RWY 02C", label: "RWY 02C SIDs", color: COLORS.sid },
      { key: "RWY 02R", label: "RWY 02R SIDs", color: COLORS.sid },
      { key: "RWY 20L", label: "RWY 20L SIDs", color: COLORS.sid },
      { key: "RWY 20C", label: "RWY 20C SIDs", color: COLORS.sid },
      { key: "RWY 20R", label: "RWY 20R SIDs", color: COLORS.sid },
    ],
    paint: {
      "line-color": COLORS.sid,
      "line-width": 2,
      // "line-dasharray": [2, 1],
    },
    layout: { visibility: VISIBILITY.sids },
  },
  {
    id: "stars",
    group: "stars",
    label: "STARs",
    url: "/data/STARs.geojson",
    type: "line",
    categoryField: "runway",  // used by MapContext to filter geojson features
    sublayers: [
      { key: "RWY 02L/02C/02R", label: "RWY 02L/02C/02R STARs", color: COLORS.star },
      { key: "RWY 20R/20C/20L", label: "RWY 20R/20C/20L STARs", color: COLORS.star },
    ],
    paint: {
      "line-color": COLORS.star,
      "line-width": 2,
      // "line-dasharray": [2,1],
    },
    layout: { visibility: VISIBILITY.stars },
  },
  {
    id: "atsRoutes",
    group: "atsRoutes",
    label: "ATS Routes",
    url: "/data/atsRoutes.geojson",
    type: "line",
    categoryField: "ATS",  // used by MapContext to filter geojson features
    sublayers: [],
    paint: {
      "line-color": COLORS.atsRoute,
      "line-width": 2,
    },
    layout: { visibility: VISIBILITY.atsRoutes },
  },
];