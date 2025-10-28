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
  };
  
// Layers configuration
export const LAYERS = [
  {
    id: "firs-fill",
    group: "firs",
    label: "FIRs",
    url: "/data/firs.geojson",
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
    url: "/data/navWarnings.geojson",
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
    url: "/data/sectors.geojson",
    type: "fill",
    categoryField: "fir",   // used by MapContext to filter geojson features
    sublayers: [
      { key: "Singapore", label: "Singapore Sectors", flag: "🇸🇬"},
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
    url: "/data/waypoints.geojson",
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
  // {
  //   id: "airways",
  //   label: "Airways",
  //   url: "/data/airways.geojson",
  //   type: "line",
  //   paint: {
  //     "line-color": "#2c7bb6",
  //     "line-width": 1.5,
  //   },
  // },
  // {
  //   id: "obstacles",
  //   label: "Obstacles",
  //   url: "/data/obstacles.geojson",
  //   type: "symbol",
  //   layout: {
  //     "icon-image": "triangle-15",
  //     "icon-size": 1.2,
  //     "icon-allow-overlap": true,
  //   },
  // },
];