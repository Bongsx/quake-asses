import { useState, useEffect } from "react";
import {
  AlertCircle,
  MapPin,
  Activity,
  Clock,
  TrendingUp,
  ArrowLeft,
  Search,
  Filter,
  X,
} from "lucide-react";
import { getDatabase, ref, onValue } from "firebase/database";
import React from "react";
import { useNavigate } from "react-router-dom";

// Mapbox token
const MAPBOX_TOKEN =
  "pk.eyJ1IjoiamJvbmd6MTQiLCJhIjoiY21nZGQ3dmRuMTA2cDJpcG5wa3J5NzNxNiJ9.908ap0Vz0J4Ru_aCO1ByAg";

const EarthquakeEventsList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationDetails, setLocationDetails] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const navigate = useNavigate();

  // Region coordinates
  const regions = {
    all: { name: "All Regions", lat: [4, 21], lon: [116, 127] },
    luzon: { name: "Luzon", lat: [14, 21], lon: [119.5, 122.5] },
    visayas: { name: "Visayas", lat: [9, 13], lon: [122, 125] },
    mindanao: { name: "Mindanao", lat: [4, 10], lon: [121, 127] },
  };

  // ✅ Fetch both structures: events/<eventId> and events/<date>/<eventId>
  useEffect(() => {
    const db = getDatabase();
    const eventsRef = ref(db, "events");

    const unsub = onValue(
      eventsRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        let combinedEvents = [];

        // 🔹 Support for events/<date>/<eventId> (grouped by date)
        Object.entries(data).forEach(([key, value]) => {
          if (typeof value === "object") {
            const firstValue = Object.values(value)[0];
            if (firstValue?.id) {
              // Nested events under a date folder
              combinedEvents.push(...Object.values(value));
            } else {
              // Direct single event (legacy structure)
              if (value.id) combinedEvents.push(value);
            }
          }
        });

        // Sort latest first
        combinedEvents.sort((a, b) => b.time - a.time);
        setEvents(combinedEvents);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Load cached locations
  useEffect(() => {
    const saved = localStorage.getItem("locationCache");
    if (saved) setLocationDetails(JSON.parse(saved));
  }, []);

  // Save location cache
  useEffect(() => {
    if (Object.keys(locationDetails).length > 0) {
      localStorage.setItem("locationCache", JSON.stringify(locationDetails));
    }
  }, [locationDetails]);

  // Fetch precise Mapbox location names
  useEffect(() => {
    if (events.length === 0) return;

    const fetchLocationDetails = async () => {
      const newDetails = {};
      const fetchPromises = events.map(async (ev) => {
        if (locationDetails[ev.id] || !ev.latitude || !ev.longitude) return;

        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${ev.longitude},${ev.latitude}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,neighborhood,address`
          );

          if (response.ok) {
            const data = await response.json();
            const placeName = data.features[0]?.place_name || ev.place;
            newDetails[ev.id] = placeName;
          }
        } catch (err) {
          console.error("Error fetching location:", err);
        }
      });

      await Promise.allSettled(fetchPromises);
      if (Object.keys(newDetails).length > 0) {
        setLocationDetails((prev) => ({ ...prev, ...newDetails }));
      }
    };

    fetchLocationDetails();
  }, [events]);

  const getDetailedLocation = (ev) =>
    locationDetails[ev.id] || ev.place || "Unknown Location";

  const filterByRegion = (event) => {
    if (selectedRegion === "all") return true;
    const region = regions[selectedRegion];
    const lat = event.latitude;
    const lon = event.longitude;
    return (
      lat >= region.lat[0] &&
      lat <= region.lat[1] &&
      lon >= region.lon[0] &&
      lon <= region.lon[1]
    );
  };

  const filterBySearch = (event) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const location = getDetailedLocation(event).toLowerCase();
    const place = (event.place || "").toLowerCase();
    const magnitude = event.magnitude?.toString() || "";
    return (
      location.includes(query) ||
      place.includes(query) ||
      magnitude.includes(query)
    );
  };

  const filteredEvents = events.filter(
    (ev) => filterByRegion(ev) && filterBySearch(ev)
  );

  const displayedEvents = filteredEvents.slice(0, 50);

  const getStats = () => {
    if (filteredEvents.length === 0)
      return { total: 0, avgMag: 0, recent24h: 0 };
    const total = filteredEvents.length;
    const avgMag = (
      filteredEvents.reduce((sum, ev) => sum + (ev.magnitude || 0), 0) / total
    ).toFixed(1);
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recent24h = filteredEvents.filter(
      (ev) => ev.time >= oneDayAgo
    ).length;
    return { total, avgMag, recent24h };
  };

  const stats = getStats();

  const getMagnitudeColor = (magnitude) => {
    if (magnitude >= 5) return "text-red-600 bg-red-50 border-red-200";
    if (magnitude >= 3) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-yellow-600 bg-yellow-50 border-yellow-200";
  };

  const getMagnitudeLabel = (magnitude) => {
    if (magnitude >= 5) return "Strong";
    if (magnitude >= 3) return "Moderate";
    return "Minor";
  };

  // Loading & Error States
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium text-lg">
            Loading earthquake events...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="bg-white border-2 border-red-300 rounded-xl shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <p className="text-red-800 text-center font-bold text-xl mb-2">
            Error Loading Events
          </p>
          <p className="text-red-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Activity className="w-10 h-10 text-blue-600" />
              Earthquake Events Monitor
            </h1>
            <p className="text-gray-600 text-lg">
              Comprehensive seismic activity tracking for the Philippines
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">
                  Total Events
                </p>
                <p className="text-4xl font-bold">{stats.total}</p>
              </div>
              <Activity className="w-12 h-12 text-blue-200 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">
                  Average Magnitude
                </p>
                <p className="text-4xl font-bold">{stats.avgMag}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-200 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">
                  Last 24 Hours
                </p>
                <p className="text-4xl font-bold">{stats.recent24h}</p>
              </div>
              <Clock className="w-12 h-12 text-green-200 opacity-80" />
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by location, magnitude, or place..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap md:flex-nowrap">
              {Object.entries(regions).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setSelectedRegion(key)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap ${
                    selectedRegion === key
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {value.name}
                </button>
              ))}
            </div>
          </div>

          {(searchQuery || selectedRegion !== "all") && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>
                Showing {filteredEvents.length} of {events.length} events
                {selectedRegion !== "all" &&
                  ` in ${regions[selectedRegion].name}`}
                {searchQuery && ` matching "${searchQuery}"`}
              </span>
            </div>
          )}
        </div>

        {/* Event List */}
        {displayedEvents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Activity className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-xl font-medium mb-2">
              No events found
            </p>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedEvents.map((event) => {
              const isLoadingLocation = !locationDetails[event.id];

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`px-4 py-2 rounded-lg border-2 ${getMagnitudeColor(
                          event.magnitude
                        )}`}
                      >
                        <span className="font-bold text-2xl">
                          M {event.magnitude}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`text-sm font-semibold ${
                            getMagnitudeColor(event.magnitude).split(" ")[0]
                          }`}
                        >
                          {getMagnitudeLabel(event.magnitude)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Earthquake</p>
                      </div>
                    </div>
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                    >
                      View Details →
                    </a>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-4">
                      <MapPin className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        {isLoadingLocation ? (
                          <p className="text-gray-400 animate-pulse font-medium">
                            Loading precise location...
                          </p>
                        ) : (
                          <p className="text-gray-900 font-bold text-lg">
                            {getDetailedLocation(event)}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">
                            {event.latitude.toFixed(4)}°N,{" "}
                            {event.longitude.toFixed(4)}°E
                          </span>
                          <span className="mx-2">•</span>
                          <span>Depth: {event.depth} km</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <p className="font-medium">{event.raw?.dateTimeStr}</p>
                    </div>

                    <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                        Source: {event.source}
                      </span>
                      <span className="text-xs text-gray-400">
                        ID: {event.id}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EarthquakeEventsList;
