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
    label: "FIR Boundaries",
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
    paint: {
      "fill-color": [
        "match",
        ["get", "category"],
        "prohibited",
        COLORS.prohibited,
        "restricted",
        COLORS.restricted,
        "danger",
        COLORS.danger,
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
          "prohibited",
          COLORS.prohibited,
          "restricted",
          COLORS.restricted,
          "danger",
          COLORS.danger,
          "#cccccc",
        ],
        "line-width": paintStyles.outlineWidth,
      },
      layout: { visibility: VISIBILITY.navWarnings },
    },
  },
  {
    id: "waypoints",
    group: "waypoints",
    label: "Waypoints",
    url: "/data/waypoints.geojson",
    type: "circle",
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