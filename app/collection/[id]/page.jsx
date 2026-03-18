"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useBookmarks } from "@/context/BookmarkContext";
import { FaArrowLeft } from "react-icons/fa";
import FeatureInfoPanel from "@/components/FeatureInfoPanel/FeatureInfoPanel";
import MeasurementTool from "@/components/Mapbox/MeasurementTool";
import MeasurementButton from "@/components/Mapbox/MeasurementButton";
import { COLORS } from "@/components/Mapbox/colors";
import { WSSS_COORDS, RADIUS_VALUES, createCircleGeoJSON } from "@/components/Mapbox/circleUtils";
import CollectionLegend from "./CollectionLegend";
import DistanceRingControl from "./DistanceRingControl";
import "./collection.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const RADIUS_SOURCE_ID = "radius-circle-source";
const RADIUS_FILL_LAYER_ID = "radius-circle-fill";
const RADIUS_OUTLINE_LAYER_ID = "radius-circle-outline";

export default function CollectionPage() {
  const params = useParams();
  const router = useRouter();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const { collections } = useBookmarks();
  const [collection, setCollection] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [legendItems, setLegendItems] = useState([]);
  const [visibleTypes, setVisibleTypes] = useState({});
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurement, setMeasurement] = useState(null);
  
  // Distance ring state
  const [radiusVisible, setRadiusVisible] = useState(false);
  const [radiusValue, setRadiusValue] = useState(40); // Default to 40NM

  const collectionId = params.id;

  useEffect(() => {
    if (collections && collectionId) {
      const col = collections[collectionId];
      setCollection(col);
    }
  }, [collections, collectionId]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [103.8198, 1.3521],
      zoom: 5,
    });

    map.current.on("load", () => {
      setMapReady(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Distance ring effect
  useEffect(() => {
    if (!map.current || !mapReady) return;

    const setupRadiusCircle = () => {
      if (!map.current.getSource(RADIUS_SOURCE_ID)) {
        map.current.addSource(RADIUS_SOURCE_ID, {
          type: "geojson",
          data: createCircleGeoJSON(WSSS_COORDS, radiusValue),
        });
      }

      if (!map.current.getLayer(RADIUS_FILL_LAYER_ID)) {
        map.current.addLayer({
          id: RADIUS_FILL_LAYER_ID,
          type: "fill",
          source: RADIUS_SOURCE_ID,
          paint: {
            "fill-color": "#3b82f6",
            "fill-opacity": 0.08,
          },
          layout: {
            visibility: radiusVisible ? "visible" : "none",
          },
        });
      }

      if (!map.current.getLayer(RADIUS_OUTLINE_LAYER_ID)) {
        map.current.addLayer({
          id: RADIUS_OUTLINE_LAYER_ID,
          type: "line",
          source: RADIUS_SOURCE_ID,
          paint: {
            "line-color": "#3b82f6",
            "line-width": 2,
            "line-dasharray": [],
          },
          layout: {
            visibility: radiusVisible ? "visible" : "none",
          },
        });
      }

      map.current.setLayoutProperty(
        RADIUS_FILL_LAYER_ID,
        "visibility",
        radiusVisible ? "visible" : "none"
      );
      map.current.setLayoutProperty(
        RADIUS_OUTLINE_LAYER_ID,
        "visibility",
        radiusVisible ? "visible" : "none"
      );

      const source = map.current.getSource(RADIUS_SOURCE_ID);
      if (source) {
        source.setData(createCircleGeoJSON(WSSS_COORDS, radiusValue));
      }
    };

    if (map.current.isStyleLoaded()) {
      setupRadiusCircle();
    } else {
      map.current.on("load", setupRadiusCircle);
    }
  }, [mapReady, radiusVisible, radiusValue]);

  const getFeatureType = useCallback((feature) => {
    const props = feature.properties || {};
    if (props.type === "SID") return "SID";
    if (props.type === "STAR") return "STAR";
    if (props.type === "ATS Route") return "ATS Route";
    if (props["fir-label"]) return "Sector";
    if (props.name?.includes("FIR") || props.NAME?.includes("FIR")) return "FIR";
    if (props.category === "prohibited") return "Prohibited Area";
    if (props.category === "restricted") return "Restricted Area";
    if (props.category === "danger") return "Danger Area";
    if (props.dme === "true") return "DME Waypoint";
    if (props.dme === "false") return "Waypoint";
    if (feature.geometry?.type === "Point") return "Waypoint";
    return feature.geometry?.type || "Feature";
  }, []);

  const getFeatureColor = useCallback((feature) => {
    const props = feature.properties || {};
    if (props.fill) return props.fill;
    if (props["fill-color"]) return props["fill-color"];
    if (props.type === "SID") return COLORS.sid;
    if (props.type === "STAR") return COLORS.star;
    if (props.type === "ATS Route") return COLORS.atsRoute;
    if (props["fir-label"]) return props["fill-color"] || COLORS.firOutline;
    if (props.name?.includes("FIR") || props.NAME?.includes("FIR")) return COLORS.firOutline;
    if (props.category === "prohibited") return COLORS.prohibited;
    if (props.category === "restricted") return COLORS.restricted;
    if (props.category === "danger") return COLORS.danger;
    if (props.dme === "true") return COLORS.waypointDME;
    if (props.dme === "false") return COLORS.waypoint;
    if (feature.geometry?.type === "Point") return COLORS.waypoint;
    return COLORS.firOutline;
  }, []);

  useEffect(() => {
    if (!map.current || !collection || !collection.features.length) return;

    const plotFeatures = () => {
      const layersToRemove = ["collection-fill", "collection-line", "collection-points"];
      layersToRemove.forEach((layerId) => {
        if (map.current.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
      });
      if (map.current.getSource("collection-features")) {
        map.current.removeSource("collection-features");
      }

      const legendMap = new Map();
      const initialVisibility = {};
      collection.features.forEach((feature) => {
        const type = getFeatureType(feature);
        const color = getFeatureColor(feature);
        if (!legendMap.has(type)) {
          legendMap.set(type, { label: type, color });
          initialVisibility[type] = true;
        }
      });
      setLegendItems(Array.from(legendMap.values()));
      setVisibleTypes((prev) => {
        const merged = { ...initialVisibility };
        Object.keys(prev).forEach((key) => {
          if (key in merged) {
            merged[key] = prev[key];
          }
        });
        return merged;
      });

      const featuresWithType = collection.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          _featureType: getFeatureType(feature),
        },
      }));

      const geojson = {
        type: "FeatureCollection",
        features: featuresWithType,
      };

      map.current.addSource("collection-features", {
        type: "geojson",
        data: geojson,
      });

      map.current.addLayer({
        id: "collection-fill",
        type: "fill",
        source: "collection-features",
        filter: ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]],
        paint: {
          "fill-color": ["case",
            ["has", "fill"], ["get", "fill"],
            ["has", "fill-color"], ["get", "fill-color"],
            ["==", ["get", "category"], "prohibited"], COLORS.prohibited,
            ["==", ["get", "category"], "restricted"], COLORS.restricted,
            ["==", ["get", "category"], "danger"], COLORS.danger,
            ["has", "fir-label"], ["coalesce", ["get", "fill-color"], COLORS.firOutline],
            COLORS.fir
          ],
          "fill-opacity": 0.35,
        },
      });

      map.current.addLayer({
        id: "collection-line",
        type: "line",
        source: "collection-features",
        filter: ["in", ["geometry-type"], ["literal", ["LineString", "Polygon", "MultiLineString", "MultiPolygon"]]],
        paint: {
          "line-color": ["case",
            ["has", "stroke"], ["get", "stroke"],
            ["==", ["get", "type"], "SID"], COLORS.sid,
            ["==", ["get", "type"], "STAR"], COLORS.star,
            ["==", ["get", "type"], "ATS Route"], COLORS.atsRoute,
            ["==", ["get", "category"], "prohibited"], COLORS.prohibited,
            ["==", ["get", "category"], "restricted"], COLORS.restricted,
            ["==", ["get", "category"], "danger"], COLORS.danger,
            ["has", "fir-label"], ["coalesce", ["get", "fill-color"], COLORS.firOutline],
            COLORS.firOutline
          ],
          "line-width": 2,
        },
      });

      map.current.addLayer({
        id: "collection-points",
        type: "circle",
        source: "collection-features",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": 4,
          "circle-color": ["match",
            ["get", "dme"],
            "false", COLORS.waypoint,
            "true", COLORS.waypointDME,
            COLORS.waypoint
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": COLORS.waypoint,
        },
      });

      const clickableLayers = ["collection-fill", "collection-line", "collection-points"];
      clickableLayers.forEach((layerId) => {
        map.current.on("click", layerId, (e) => {
          if (isMeasuring) return;
          if (e.features && e.features.length > 0) {
            setSelectedFeature(e.features[0]);
          }
        });

        map.current.on("mouseenter", layerId, () => {
          if (!isMeasuring) {
            map.current.getCanvas().style.cursor = "pointer";
          }
        });

        map.current.on("mouseleave", layerId, () => {
          if (!isMeasuring) {
            map.current.getCanvas().style.cursor = "";
          }
        });
      });

      const bounds = new mapboxgl.LngLatBounds();
      collection.features.forEach((feature) => {
        const coords = feature.geometry.coordinates;
        if (feature.geometry.type === "Point") {
          bounds.extend(coords);
        } else if (feature.geometry.type === "LineString") {
          coords.forEach((coord) => bounds.extend(coord));
        } else if (feature.geometry.type === "Polygon") {
          coords[0].forEach((coord) => bounds.extend(coord));
        } else if (feature.geometry.type === "MultiPolygon") {
          coords.forEach((polygon) => {
            polygon[0].forEach((coord) => bounds.extend(coord));
          });
        }
      });

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 50 });
      }
    };

    if (map.current.isStyleLoaded()) {
      plotFeatures();
    } else {
      map.current.on("load", plotFeatures);
    }
  }, [collection, isMeasuring, getFeatureType, getFeatureColor]);

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const visibleTypesList = Object.entries(visibleTypes)
      .filter(([_, visible]) => visible)
      .map(([type]) => type);

    const baseFilters = {
      "collection-fill": ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]],
      "collection-line": ["in", ["geometry-type"], ["literal", ["LineString", "Polygon", "MultiLineString", "MultiPolygon"]]],
      "collection-points": ["==", ["geometry-type"], "Point"],
    };

    Object.entries(baseFilters).forEach(([layerId, baseFilter]) => {
      if (map.current.getLayer(layerId)) {
        const combinedFilter = ["all",
          baseFilter,
          ["in", ["get", "_featureType"], ["literal", visibleTypesList]]
        ];
        map.current.setFilter(layerId, combinedFilter);
      }
    });
  }, [visibleTypes]);

  const handleToggleType = useCallback((type) => {
    setVisibleTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  const handleClosePanel = () => {
    setSelectedFeature(null);
  };

  const handleMeasurementToggle = () => {
    setIsMeasuring(!isMeasuring);
    if (isMeasuring) {
      setMeasurement(null);
    }
  };

  return (
    <div className="collection-page">
      <div className="collection-header-bar">
        <button className="back-btn" onClick={() => router.back()}>
          <FaArrowLeft /> Back
        </button>
        <h2>{collection?.name || "Collection"}</h2>
        <span className="feature-count">
          {collection?.features?.length || 0} features
        </span>
      </div>
      
      <div className="collection-map-container" ref={mapContainer} />
      
      {mapReady && map.current && (
        <MeasurementTool
          map={map.current}
          isActive={isMeasuring}
          onMeasurementChange={setMeasurement}
        />
      )}
      
      <div className="collection-measurement-controls">
        <MeasurementButton
          isActive={isMeasuring}
          onClick={handleMeasurementToggle}
          measurement={measurement}
        />
      </div>
      
      <DistanceRingControl
        visible={radiusVisible}
        radius={radiusValue}
        onToggleVisible={setRadiusVisible}
        onRadiusChange={setRadiusValue}
      />
      
      {selectedFeature && (
        <FeatureInfoPanel
          feature={selectedFeature}
          onClose={handleClosePanel}
        />
      )}
      
      {legendItems.length > 0 && (
        <CollectionLegend 
          items={legendItems} 
          visibleTypes={visibleTypes}
          onToggleType={handleToggleType}
        />
      )}
    </div>
  );
}