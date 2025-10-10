import React, { useEffect, useState } from "react";
import { db, ref, onValue } from "../firebase/firebaseClient";
import MapView from "./MapView";
import { Activity, TrendingUp, Clock, MapPin } from "lucide-react";
import AiAlert from "./AiAlert";
import { useNavigate } from "react-router-dom";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiamJvbmd6MTQiLCJhIjoiY21nZGQ3dmRuMTA2cDJpcG5wa3J5NzNxNiJ9.908ap0Vz0J4Ru_aCO1ByAg";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationDetails, setLocationDetails] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const eventsRef = ref(db, "events");
    const unsub = onValue(eventsRef, (snapshot) => {
      const val = snapshot.val() || {};
      const arr = Object.values(val).sort((a, b) => b.time - a.time);
      setEvents(arr);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch detailed location using Mapbox
  useEffect(() => {
    const fetchLocationDetails = async () => {
      for (const ev of events) {
        if (locationDetails[ev.id] || !ev.latitude || !ev.longitude) continue;

        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${ev.longitude},${ev.latitude}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,neighborhood,address`
          );

          if (response.ok) {
            const data = await response.json();
            const placeName = data.features[0]?.place_name || ev.place;
            setLocationDetails((prev) => ({
              ...prev,
              [ev.id]: placeName,
            }));
          }
        } catch (error) {
          console.error("Error fetching location:", error);
        }

        await new Promise((resolve) => setTimeout(resolve, 500)); // Rate limiting
      }
    };

    if (events.length > 0) {
      fetchLocationDetails();
    }
  }, [events]);

  const getDetailedLocation = (ev) => {
    return locationDetails[ev.id] || "Loading precise location...";
  };

  const getStats = () => {
    if (events.length === 0) return { total: 0, avgMag: 0, recent24h: 0 };

    const total = events.length;
    const avgMag = (
      events.reduce((sum, ev) => sum + (ev.magnitude || 0), 0) / total
    ).toFixed(1);

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recent24h = events.filter((ev) => ev.time >= oneDayAgo).length;

    return { total, avgMag, recent24h };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Live Earthquakes Monitor
          </h1>
        </div>
        <p className="text-gray-600">
          Real-time seismic activity tracking for the Philippines
        </p>
      </div>

      {/* AI Alert Component */}
      <div className="max-w-7xl mx-auto">
        <AiAlert />
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Activity className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Magnitude</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgMag}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-orange-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Last 1 Hour</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.recent24h}
              </p>
            </div>
            <Clock className="w-10 h-10 text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Map View */}
      <div className="max-w-7xl mx-auto mb-6">
        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading earthquake data...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No earthquake events to display</p>
          </div>
        ) : (
          <MapView events={events} />
        )}
      </div>

      {/* Recent Events List */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Recent Events
          </h3>

          <button
            onClick={() => navigate("/earthquake-events")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            View All Events
            <Activity className="w-4 h-4" />
          </button>
        </div>

        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No events recorded yet
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {events.slice(0, 20).map((ev) => {
              const magnitude = ev.magnitude || 0;
              const magnitudeColor =
                magnitude >= 6
                  ? "text-red-600"
                  : magnitude >= 5
                  ? "text-orange-600"
                  : magnitude >= 4
                  ? "text-yellow-600"
                  : "text-green-600";

              const detailedLocation = getDetailedLocation(ev);

              return (
                <div
                  key={ev.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* Magnitude Badge */}
                  <div className="flex-shrink-0">
                    <div
                      className={`${magnitudeColor} font-bold text-xl bg-white px-3 py-2 rounded-lg shadow-sm border-2 border-current`}
                    >
                      M{magnitude.toFixed(1)}
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-base mb-1">
                          {detailedLocation}
                        </h4>
                        <div className="text-sm text-gray-600">
                          <span>Depth: {ev.depth || "N/A"} km</span>
                          <span className="mx-2">•</span>
                          <span>
                            {ev.latitude?.toFixed(4)}°N,{" "}
                            {ev.longitude?.toFixed(4)}°E
                          </span>
                          <span className="mx-2">•</span>
                          <span>{ev.raw.dateTimeStr}</span>
                        </div>
                      </div>
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
}
