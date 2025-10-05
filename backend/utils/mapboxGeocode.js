import mbxClient from "@mapbox/mapbox-sdk";
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiamJvbmd6MTQiLCJhIjoiY21nZGQ3dmRuMTA2cDJpcG5wa3J5NzNxNiJ9.908ap0Vz0J4Ru_aCO1ByAg";

const baseClient = mbxClient({ accessToken: MAPBOX_TOKEN });
const geocodingClient = mbxGeocoding(baseClient);

export async function reverseGeocode(lat, lon) {
  try {
    const response = await geocodingClient
      .reverseGeocode({
        query: [lon, lat],
        types: ["address", "place", "region", "locality", "neighborhood"],
        limit: 1,
      })
      .send();

    if (response && response.body && response.body.features.length > 0) {
      return response.body.features[0]; // returns a Mapbox feature object
    } else {
      return null;
    }
  } catch (err) {
    console.error("Mapbox reverseGeocode error:", err.message);
    return null;
  }
}
