// utils/analyzeGemini.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { db } = require("../firebase-admin");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to sanitize location for Firebase keys
function sanitizeLocation(location) {
  if (!location) return "Unknown";
  // Remove invalid characters and replace spaces with "-"
  return location
    .replace(/[.#$/\[\]]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

async function analyzeWithGemini() {
  try {
    console.log("🤖 Starting Gemini AI analysis...");

    const snapshot = await db.ref("events").once("value");
    const events = snapshot.val() || {};
    const eventArray = Object.values(events).sort((a, b) => b.time - a.time);

    if (eventArray.length === 0) {
      console.log("⚠️ No events to analyze");
      return;
    }

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recentEvents = eventArray.filter((e) => e.time >= oneDayAgo);

    // Group events by sanitized location (e.g., "Bogo-Cebu")
    const eventsByLocation = {};
    recentEvents.forEach((e) => {
      const rawLocation = e.location || e.place || "Unknown";
      const locKey = sanitizeLocation(rawLocation);
      if (!eventsByLocation[locKey]) eventsByLocation[locKey] = [];
      eventsByLocation[locKey].push(e);
    });

    const locationSummaries = {};
    Object.entries(eventsByLocation).forEach(([location, events]) => {
      const maxMagnitude = Math.max(...events.map((e) => e.magnitude));
      const totalEvents = events.length;

      let riskLevel = "low";
      if (maxMagnitude >= 6.0) {
        riskLevel = "critical";
      } else if (maxMagnitude >= 5.0 || totalEvents > 20) {
        riskLevel = "high";
      } else if (maxMagnitude >= 4.0 || totalEvents > 10) {
        riskLevel = "moderate";
      }

      const avgMagnitude = (
        events.reduce((sum, e) => sum + e.magnitude, 0) / events.length
      ).toFixed(2);

      // Store summary without coordinates in the key
      locationSummaries[location] = {
        totalEvents,
        maxMagnitude,
        avgMagnitude,
        riskLevel,
        events: events.slice(0, 50).map((e) => ({
          magnitude: e.magnitude,
          latitude: e.latitude,
          longitude: e.longitude,
          depth: e.depth,
          dateTime: e.dateTimeStr || new Date(e.time).toISOString(),
          source: e.source,
        })),
      };
    });

    // Prepare Gemini prompt
    const prompt = `You are an expert seismologist analyzing earthquake events by location in the Philippines.

Analyze the earthquake events recorded in the past 24 hours per location:

${JSON.stringify(locationSummaries, null, 2)}

For each location, provide:
1. Seismic activity level (Low, Moderate, High, or Critical)
2. Patterns or clusters you observe
3. Areas of concern (e.g., provinces, regions)
4. Public awareness and safety tips for people in the affected locations.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const analysis = result.response.text();

    console.log("✅ Gemini analysis completed");

    const analysisData = {
      analysis,
      locationSummaries,
      timestamp: Date.now(),
      generatedAt: new Date().toISOString(),
    };

    await db.ref("aiAnalysis/last").set(analysisData);
    await db.ref(`aiAnalysis/history/${Date.now()}`).set(analysisData);

    console.log("💾 Analysis saved to Firebase");
    return analysisData;
  } catch (err) {
    console.error("❌ Gemini analysis error:", err.message);
    await db.ref("aiAnalysis/last").set({
      error: err.message,
      timestamp: Date.now(),
    });
    throw err;
  }
}

module.exports = { analyzeWithGemini };
