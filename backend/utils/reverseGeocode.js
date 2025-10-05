const axios = require("axios");

async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse`;
  try {
    const res = await axios.get(url, {
      params: { format: "jsonv2", lat, lon, zoom: 18, addressdetails: 1 },
      headers: { "User-Agent": "quake-detector/1.0 joshuabongz7@gmail.com" },
    });
    return res.data; // contains display_name and address object
  } catch (err) {
    console.error("reverseGeocode error", err.message);
    return null;
  }
}

module.exports = { reverseGeocode };
