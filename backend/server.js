// server.js - WITH GEMINI AI ANALYSIS + DAILY GROUPING INTEGRATED
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const cron = require("node-cron");
const dotenv = require("dotenv");
const { admin, db } = require("./firebase-admin");
const { reverseGeocode } = require("./utils/reverseGeocode");
const { scrapePHIVOLCS } = require("./utils/phivolcsScraper");

dotenv.config();

// Import Gemini analyzer after dotenv.config()
let analyzeWithGemini;
try {
  const geminiModule = require("./utils/analyzeGemini");
  analyzeWithGemini = geminiModule.analyzeWithGemini;
  console.log("✅ Gemini AI module loaded successfully");
} catch (err) {
  console.warn("⚠️  Gemini AI module not found or error loading:", err.message);
  console.warn(
    "⚠️  AI analysis will be disabled. Create utils/analyzeGemini.js to enable."
  );
  analyzeWithGemini = null;
}

const app = express();
app.use(cors());
app.use(express.json());

const USGS_FEED =
  process.env.USGS_FEED ||
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson";

const USGS_API_PHILIPPINES =
  "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson" +
  "&starttime=" +
  new Date(Date.now() - 60 * 60 * 1000).toISOString() +
  "&minlatitude=4.5&maxlatitude=21&minlongitude=116&maxlongitude=127" +
  "&minmagnitude=1.5&orderby=time";

// Cache for reverse geocoding
const locationCache = new Map();

function usgsFeatureToEvent(feature) {
  const coords = feature.geometry.coordinates;
  const timestamp = feature.properties.time;
  const dateObj = new Date(timestamp);

  // Format to: "11 October 2025 - 05:57 PM"
  const dateTimeStr = dateObj
    .toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", " -");

  // Location formatting similar to PHIVOLCS
  const location = feature.properties.place || "Unknown Location";

  return {
    id: feature.id,
    source: "usgs",
    magnitude: parseFloat(feature.properties.mag) || 0,
    latitude: parseFloat(coords[1]) || 0,
    longitude: parseFloat(coords[0]) || 0,
    depth: parseFloat(coords[2]) || 0,
    time: timestamp,
    place: location,
    type: feature.properties.type || "earthquake",
    url: feature.properties.url,
    raw: {
      dateTimeStr,
      location,
      mag: feature.properties.mag,
      depth: feature.properties.depth,
      time: timestamp,
      place: feature.properties.place,
      title: feature.properties.title,
      status: feature.properties.status,
      type: feature.properties.type,
    },
  };
}

function isInPhilippines(lat, lon) {
  return lat >= 4.5 && lat <= 21 && lon >= 116 && lon <= 127;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAndPush(useAPI = false, includePHIVOLCS = true) {
  try {
    const startTime = Date.now();
    console.log("🔄 Fetching earthquake data...");

    let allEvents = [];

    // 1. Fetch USGS data
    const url = useAPI ? USGS_API_PHILIPPINES : USGS_FEED;
    const usgs = await axios.get(url, { timeout: 10000 });
    const features = usgs.data.features || [];

    console.log(`📊 Found ${features.length} USGS earthquakes`);

    const filtered = useAPI
      ? features
      : features.filter((f) => {
          const coords = f.geometry.coordinates;
          return isInPhilippines(coords[1], coords[0]);
        });

    console.log(`🇺🇸 ${filtered.length} USGS events in Philippines region`);

    allEvents = filtered.map((f) => usgsFeatureToEvent(f));

    // 2. Fetch PHIVOLCS data
    if (includePHIVOLCS) {
      try {
        const phivolcsEvents = await scrapePHIVOLCS();
        console.log(`🇵🇭 ${phivolcsEvents.length} PHIVOLCS events`);
        allEvents = [...allEvents, ...phivolcsEvents];
      } catch (phivolcsErr) {
        console.error("⚠️  PHIVOLCS scraping failed:", phivolcsErr.message);
      }
    }

    let newCount = 0;
    let skippedCount = 0;

    for (const e of allEvents) {
      const eventDate = new Date(e.time).toISOString().split("T")[0];
      const sanitizedId = e.id.replace(/[.#$[\]]/g, "_");

      // Path example: events/2025-10-11/<eventId>
      const eventRef = db.ref(`events/${eventDate}/${sanitizedId}`);
      const snap = await eventRef.once("value");

      if (snap.exists()) {
        skippedCount++;
        continue;
      }

      let locationName = e.place;

      // Only reverse geocode USGS events
      if (e.source === "usgs") {
        const cacheKey = `${e.latitude.toFixed(2)},${e.longitude.toFixed(2)}`;
        locationName = locationCache.get(cacheKey);

        if (!locationName) {
          await delay(1100);
          const rg = await reverseGeocode(e.latitude, e.longitude);
          locationName =
            rg?.address?.village ||
            rg?.address?.municipality ||
            rg?.address?.town ||
            rg?.address?.city ||
            rg?.address?.province ||
            rg?.display_name ||
            e.place;

          locationCache.set(cacheKey, locationName);

          if (locationCache.size > 1000) {
            const firstKey = locationCache.keys().next().value;
            locationCache.delete(firstKey);
          }
        }
      }

      await eventRef.set({
        id: sanitizedId,
        source: e.source,
        magnitude: e.magnitude,
        latitude: e.latitude,
        longitude: e.longitude,
        depth: e.depth,
        time: e.time,
        place: locationName,
        type: e.type,
        url: e.url || null,
        raw: e.raw,
        createdAt: Date.now(),
      });

      newCount++;
      if (newCount <= 10) {
        console.log(
          `✅ Saved: ${sanitizedId.substring(
            0,
            30
          )}... | M${e.magnitude.toFixed(1)} | ${locationName.substring(
            0,
            50
          )} [${e.source.toUpperCase()}]`
        );
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `✅ Completed in ${duration}s | New: ${newCount} | Skipped: ${skippedCount}`
    );
  } catch (err) {
    console.error("❌ fetchAndPush error:", err.message);
  }
}

// Cron jobs
const cronExpr = process.env.POLL_CRON || "*/5 * * * *";
cron.schedule(cronExpr, () => {
  console.log("⏰ Cron triggered:", new Date().toISOString());
  fetchAndPush(false, true);
});

cron.schedule("0 * * * *", () => {
  console.log("⏰ Hourly API sync:", new Date().toISOString());
  fetchAndPush(true, true);
});

cron.schedule("0 * * * *", () => {
  console.log("🤖 Running Gemini AI analysis...");
  analyzeWithGemini?.().catch((err) =>
    console.error("❌ Gemini analysis error:", err.message)
  );
});

// Startup
console.log("🚀 Starting initial fetch...");
fetchAndPush(false, true);

setTimeout(() => {
  console.log("🤖 Running initial Gemini AI analysis...");
  analyzeWithGemini?.().catch((err) =>
    console.error("❌ Initial Gemini analysis error:", err.message)
  );
}, 30000);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    time: Date.now(),
    uptime: process.uptime(),
    cacheSize: locationCache.size,
  });
});

// Get all events (combine all date folders)
app.get("/api/events", async (req, res) => {
  try {
    const snapshot = await db.ref("events").once("value");
    const allData = snapshot.val() || {};

    let eventArray = [];
    for (const [date, events] of Object.entries(allData)) {
      eventArray.push(...Object.values(events));
    }

    eventArray.sort((a, b) => b.time - a.time);
    res.json({ count: eventArray.length, events: eventArray });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get events by source
app.get("/api/events/:source", async (req, res) => {
  try {
    const { source } = req.params;
    const snapshot = await db.ref("events").once("value");
    const allData = snapshot.val() || {};

    let eventArray = [];
    for (const [date, events] of Object.entries(allData)) {
      eventArray.push(...Object.values(events));
    }

    eventArray = eventArray
      .filter((e) => e.source === source.toLowerCase())
      .sort((a, b) => b.time - a.time);

    res.json({ count: eventArray.length, source, events: eventArray });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI analysis
app.get("/api/ai-analysis", async (req, res) => {
  try {
    const snapshot = await db.ref("aiAnalysis/last").once("value");
    const analysis = snapshot.val();
    if (!analysis)
      return res.json({ message: "No analysis yet", timestamp: null });
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/trigger-analysis", async (req, res) => {
  try {
    console.log("🔧 Manual AI analysis triggered");
    analyzeWithGemini?.();
    res.json({ message: "AI analysis triggered", timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual fetch trigger
app.post("/api/trigger-fetch", async (req, res) => {
  const useAPI = req.query.useAPI === "true";
  const includePHIVOLCS = req.query.phivolcs !== "false";
  console.log("🔧 Manual fetch triggered");
  fetchAndPush(useAPI, includePHIVOLCS);
  res.json({ message: "Fetch triggered", useAPI, includePHIVOLCS });
});

// Cleanup old folders
app.post("/api/cleanup", async (req, res) => {
  try {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const snapshot = await db.ref("events").once("value");
    const allData = snapshot.val() || {};

    let deletedCount = 0;
    for (const [date, events] of Object.entries(allData)) {
      const folderTime = new Date(date).getTime();
      if (folderTime < thirtyDaysAgo) {
        await db.ref(`events/${date}`).remove();
        deletedCount++;
      }
    }

    res.json({ message: "Cleanup completed", deletedFolders: deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stats endpoint
app.get("/api/stats", async (req, res) => {
  try {
    const snapshot = await db.ref("events").once("value");
    const allData = snapshot.val() || {};

    let eventArray = [];
    for (const [date, events] of Object.entries(allData)) {
      eventArray.push(...Object.values(events));
    }

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const stats = {
      total: eventArray.length,
      lastHour: eventArray.filter((e) => e.time >= oneHourAgo).length,
      last24Hours: eventArray.filter((e) => e.time >= oneDayAgo).length,
      lastWeek: eventArray.filter((e) => e.time >= oneWeekAgo).length,
      bySource: {
        usgs: eventArray.filter((e) => e.source === "usgs").length,
        phivolcs: eventArray.filter((e) => e.source === "phivolcs").length,
      },
      avgMagnitude:
        eventArray.length > 0
          ? (
              eventArray.reduce((sum, e) => sum + e.magnitude, 0) /
              eventArray.length
            ).toFixed(2)
          : 0,
      maxMagnitude:
        eventArray.length > 0
          ? Math.max(...eventArray.map((e) => e.magnitude)).toFixed(1)
          : 0,
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend listening on port ${PORT}`);
  console.log(`📍 Monitoring Philippines region (4.5°N-21°N, 116°E-127°E)`);
  console.log(`⏰ Polling every ${cronExpr} (USGS + PHIVOLCS)`);
  console.log(`🤖 Gemini AI analysis every hour`);
  console.log(`💾 Grouped by date (daily folders in Firebase)\n`);
});
