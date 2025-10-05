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

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    validEvents.forEach((ev) => {
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.style.width = `${getMagnitudeSize(ev.magnitude)}px`;
      el.style.height = `${getMagnitudeSize(ev.magnitude)}px`;
      el.style.backgroundColor = getMagnitudeColor(ev.magnitude);
      el.style.borderRadius = "50%";
      el.style.border = "2px solid white";
      el.style.cursor = "pointer";
      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      el.style.transition = "transform 0.2s";

      // Pulse animation for large events
      if (ev.magnitude >= 5) {
        el.style.animation = "pulse 2s infinite";
      }

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.3)";
        el.style.zIndex = "1000";
        setHoveredEvent(ev);
      });

      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
        el.style.zIndex = "auto";
        setHoveredEvent(null);
      });

      el.addEventListener("click", () => {
        setSelectedEvent(ev);
      });

      const marker = new window.mapboxgl.Marker(el)
        .setLngLat([ev.longitude, ev.latitude])
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });

    // Add pulse animation style
    if (!document.getElementById("pulse-style")) {
      const style = document.createElement("style");
      style.id = "pulse-style";
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `;
      document.head.appendChild(style);
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
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg z-10 overflow-hidden">
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
        <h4 className="text-xs font-bold text-gray-800 mb-2">Magnitude</h4>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className="text-gray-700">≥ 7.0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-600"></div>
            <span className="text-gray-700">6.0 - 6.9</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
            <span className="text-gray-700">5.0 - 5.9</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-700">4.0 - 4.9</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-700">&lt; 4.0</span>
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredEvent && !selectedEvent && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
          <div className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs whitespace-nowrap shadow-xl">
            <div className="font-bold">
              {hoveredEvent.place || hoveredEvent.raw?.place}
            </div>
            <div>
              M{hoveredEvent.magnitude.toFixed(1)} • {hoveredEvent.depth}km deep
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
