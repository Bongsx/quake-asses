// src/utils/reverseGeocodeCache.js

// Local cache to store coordinates -> location results
const reverseGeocodeCache = {};

/**
 * Get human-readable location (like "Bogo City, Cebu")
 * for given latitude and longitude.
 * It uses OpenStreetMap API and caches the result.
 */
export async function getLocationName(lat, lon) {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;

  // If we already have the location in cache, return it
  if (reverseGeocodeCache[key]) {
    return reverseGeocodeCache[key];
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    const data = await res.json();
    const location = data.display_name || "Unknown location";

    // Cache it
    reverseGeocodeCache[key] = location;

    return location;
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return "Unknown location";
  }
}
