import { useState, useEffect, useRef } from "react";
import React from "react";
import { MapPin, X, AlertCircle, ZoomIn, ZoomOut, Layers } from "lucide-react";

export default function MapView({
  events = [],
  center = [124.0, 11.1],
  zoom = 6,
}) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [mapStyle, setMapStyle] = useState("streets-v12");
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Mapbox access token
  const MAPBOX_TOKEN =
    "pk.eyJ1IjoiamJvbmd6MTQiLCJhIjoiY21nZGQ3dmRuMTA2cDJpcG5wa3J5NzNxNiJ9.908ap0Vz0J4Ru_aCO1ByAg";

  const validEvents = events.filter(
    (ev) =>
      ev.latitude &&
      ev.longitude &&
      ev.latitude >= -90 &&
      ev.latitude <= 90 &&
      ev.longitude >= -180 &&
      ev.longitude <= 180
  );

  const getMagnitudeColor = (magnitude) => {
    if (magnitude >= 7) return "#dc2626";
    if (magnitude >= 6) return "#ea580c";
    if (magnitude >= 5) return "#ca8a04";
    if (magnitude >= 4) return "#eab308";
    return "#22c55e";
  };

  const getMagnitudeSize = (magnitude) => {
    if (magnitude >= 7) return 24;
    if (magnitude >= 6) return 20;
    if (magnitude >= 5) return 16;
    if (magnitude >= 4) return 12;
    return 10;
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Load Mapbox CSS
    if (!document.getElementById("mapbox-css")) {
      const link = document.createElement("link");
      link.id = "mapbox-css";
      link.rel = "stylesheet";
      link.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css";
      document.head.appendChild(link);
    }

    // Load Mapbox JS
    const loadMapbox = () => {
      if (window.mapboxgl) {
        initMap();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js";
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    };

    const initMap = () => {
      if (!window.mapboxgl || mapRef.current) return;

      const mapboxgl = window.mapboxgl;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: `mapbox://styles/mapbox/${mapStyle}`,
        center: center,
        zoom: zoom,
      });

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      mapRef.current = map;

      // Add markers when map loads
      map.on("load", () => {
        updateMarkers();
      });
    };

    loadMapbox();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when events change
  useEffect(() => {
    if (mapRef.current && window.mapboxgl) {
      updateMarkers();
    }
  }, [validEvents]);

  // Update map style
  useEffect(() => {
    if (mapRef.current && window.mapboxgl) {
      mapRef.current.setStyle(`mapbox://styles/mapbox/${mapStyle}`);
      mapRef.current.once("styledata", () => {
        updateMarkers();
      });
    }
  }, [mapStyle]);

  const updateMarkers = () => {
    if (!mapRef.current || !window.mapboxgl) return;

    const map = mapRef.current;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add heatmap layer if it doesn't exist
    if (!map.getSource("earthquakes")) {
      map.addSource("earthquakes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: validEvents.map((ev) => ({
            type: "Feature",
            properties: {
              magnitude: ev.magnitude,
              depth: ev.depth,
              place: ev.place || ev.raw?.place,
              time: ev.time,
              source: ev.source,
            },
            geometry: {
              type: "Point",
              coordinates: [ev.longitude, ev.latitude],
            },
          })),
        },
      });

      // Heatmap layer
      map.addLayer(
        {
          id: "earthquakes-heat",
          type: "heatmap",
          source: "earthquakes",
          maxzoom: 10,
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["get", "magnitude"],
              0,
              0,
              8,
              1,
            ],
            "heatmap-intensity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              1,
              9,
              3,
            ],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(33,102,172,0)",
              0.2,
              "rgb(103,169,207)",
              0.4,
              "rgb(209,229,240)",
              0.6,
              "rgb(253,219,199)",
              0.8,
              "rgb(239,138,98)",
              1,
              "rgb(178,24,43)",
            ],
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              2,
              9,
              20,
            ],
            "heatmap-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              7,
              1,
              10,
              0,
            ],
          },
        },
        "waterway-label"
      );

      // Circle layer for zoomed in view
      map.addLayer(
        {
          id: "earthquakes-point",
          type: "circle",
          source: "earthquakes",
          minzoom: 8,
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "magnitude"],
              3,
              4,
              4,
              6,
              5,
              8,
              6,
              10,
              7,
              14,
              8,
              18,
            ],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "magnitude"],
              3,
              "#22c55e",
              4,
              "#eab308",
              5,
              "#ca8a04",
              6,
              "#ea580c",
              7,
              "#dc2626",
            ],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              8,
              0,
              10,
              1,
            ],
          },
        },
        "waterway-label"
      );

      // Add click handler for points
      map.on("click", "earthquakes-point", (e) => {
        if (e.features.length > 0) {
          const feature = e.features[0];
          const props = feature.properties;
          setSelectedEvent({
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0],
            magnitude: props.magnitude,
            depth: props.depth,
            place: props.place,
            time: props.time,
            source: props.source,
          });
        }
      });

      // Change cursor on hover
      map.on("mouseenter", "earthquakes-point", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "earthquakes-point", () => {
        map.getCanvas().style.cursor = "";
      });

      // Add hover tooltip
      map.on("mousemove", "earthquakes-point", (e) => {
        if (e.features.length > 0) {
          const feature = e.features[0];
          const props = feature.properties;
          setHoveredEvent({
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0],
            magnitude: props.magnitude,
            depth: props.depth,
            place: props.place,
            time: props.time,
          });
        }
      });

      map.on("mouseleave", "earthquakes-point", () => {
        setHoveredEvent(null);
      });
    } else {
      // Update existing source
      map.getSource("earthquakes").setData({
        type: "FeatureCollection",
        features: validEvents.map((ev) => ({
          type: "Feature",
          properties: {
            magnitude: ev.magnitude,
            depth: ev.depth,
            place: ev.place || ev.raw?.place,
            time: ev.time,
            source: ev.source,
          },
          geometry: {
            type: "Point",
            coordinates: [ev.longitude, ev.latitude],
          },
        })),
      });
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const mapStyles = [
    { id: "streets-v12", name: "Streets", icon: "🗺️" },
    { id: "satellite-streets-v12", name: "Satellite", icon: "🛰️" },
    { id: "outdoors-v12", name: "Outdoors", icon: "🏔️" },
    { id: "dark-v11", name: "Dark", icon: "🌙" },
  ];

  return (
    <div className="relative w-full h-[70vh] rounded-lg overflow-hidden shadow-lg">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Header */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg z-10">
        <h3 className="text-sm font-bold text-gray-800">
          Philippines Seismic Activity
        </h3>
        <p className="text-xs text-gray-600">Real-time earthquake monitoring</p>
      </div>

      {/* Map Style Selector */}
      <div className="absolute bottom-56 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg z-10 overflow-hidden">
        {mapStyles.map((style) => (
          <button
            key={style.id}
            onClick={() => setMapStyle(style.id)}
            className={`w-full px-4 py-2 text-xs font-medium text-left hover:bg-gray-100 transition-colors flex items-center gap-2 ${
              mapStyle === style.id
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700"
            }`}
          >
            <span>{style.icon}</span>
            <span>{style.name}</span>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-20 right-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg z-10">
        <h4 className="text-xs font-bold text-gray-800 mb-2">
          {mapRef.current && mapRef.current.getZoom() >= 9
            ? "Magnitude"
            : "Seismic Activity"}
        </h4>
        {mapRef.current && mapRef.current.getZoom() >= 9 ? (
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-gray-700">≥ 7.0 Major</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-600"></div>
              <span className="text-gray-700">6.0-6.9 Strong</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
              <span className="text-gray-700">5.0-5.9 Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-gray-700">4.0-4.9 Light</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-700">&lt; 4.0 Minor</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 bg-gradient-to-r from-blue-500 via-yellow-400 to-red-600 rounded"></div>
            </div>
            <div className="text-gray-600 text-[10px]">
              Low → High frequency
            </div>
            <div className="text-gray-500 text-[10px] mt-2">
              Zoom in to see details
            </div>
          </div>
        )}
      </div>

      {/* Hover Tooltip */}
      {hoveredEvent && !selectedEvent && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
          <div className="bg-gray-900 text-white px-4 py-3 rounded-lg text-xs shadow-xl max-w-xs">
            <div className="font-bold text-sm mb-1">{hoveredEvent.place}</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-300">Magnitude:</span>
                <span className="font-semibold">
                  M{hoveredEvent.magnitude.toFixed(1)}
                  <span
                    className={`ml-2 text-xs ${
                      hoveredEvent.magnitude >= 6
                        ? "text-red-400"
                        : hoveredEvent.magnitude >= 5
                        ? "text-orange-400"
                        : hoveredEvent.magnitude >= 4
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {hoveredEvent.magnitude >= 6
                      ? "STRONG"
                      : hoveredEvent.magnitude >= 5
                      ? "MODERATE"
                      : hoveredEvent.magnitude >= 4
                      ? "LIGHT"
                      : "MINOR"}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-300">Depth:</span>
                <span className="font-semibold">{hoveredEvent.depth}km</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-300">Time:</span>
                <span className="font-semibold text-xs">
                  {new Date(hoveredEvent.time).toLocaleString("en-PH", {
                    timeZone: "Asia/Manila",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Event Popup */}
      {selectedEvent && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-2xl p-5 max-w-md w-11/12 z-30">
          <button
            onClick={() => setSelectedEvent(null)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  selectedEvent.magnitude >= 6
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              />
              <h3 className="font-bold text-gray-900 text-lg leading-tight pr-6">
                {selectedEvent.place || selectedEvent.raw?.place}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Magnitude:</span>
                <div className="font-bold text-gray-900">
                  M{selectedEvent.magnitude.toFixed(1)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Depth:</span>
                <div className="font-bold text-gray-900">
                  {selectedEvent.depth} km
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Time:</span>
                <div className="font-bold text-gray-900">
                  {new Date(selectedEvent.time).toLocaleString("en-PH", {
                    timeZone: "Asia/Manila",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Latitude:</span>
                <div className="font-medium text-gray-900">
                  {selectedEvent.latitude.toFixed(4)}°N
                </div>
              </div>
              <div>
                <span className="text-gray-600">Longitude:</span>
                <div className="font-medium text-gray-900">
                  {selectedEvent.longitude.toFixed(4)}°E
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Source:</span>
                <div className="font-medium text-gray-900 uppercase">
                  {selectedEvent.source}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Count Badge */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg z-10">
        <div className="text-xs text-gray-600">Total Events</div>
        <div className="text-2xl font-bold text-gray-900">
          {validEvents.length}
        </div>
      </div>

      {/* API Key Warning */}
      {MAPBOX_TOKEN === "YOUR_MAPBOX_TOKEN_HERE" && (
        <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
              Mapbox Token Required
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              To display the map, you need a free Mapbox access token:
            </p>
            <ol className="text-sm text-gray-700 space-y-2 mb-4 list-decimal list-inside">
              <li>
                Visit{" "}
                <a
                  href="https://account.mapbox.com/access-tokens/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  account.mapbox.com
                </a>
              </li>
              <li>Create a free account</li>
              <li>Copy your default public token</li>
              <li>Replace MAPBOX_TOKEN in the code</li>
            </ol>
            <p className="text-xs text-gray-500">
              Free tier includes 50,000 map loads per month
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
