// utils/analyzeGemini.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { db } = require("../firebase-admin");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeWithGemini() {
  try {
    console.log("🤖 Starting Gemini AI analysis...");

    // Fetch all events from Firebase
    const snapshot = await db.ref("events").once("value");
    const events = snapshot.val() || {};
    const eventArray = Object.values(events).sort((a, b) => b.time - a.time);

    if (eventArray.length === 0) {
      console.log("⚠️  No events to analyze");
      return;
    }

    // ✅ Set time window to 1 day (24 hours)
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recentEvents = eventArray.filter((e) => e.time >= oneDayAgo);

    // ✅ Prepare summary for Gemini analysis
    const summary = {
      totalEvents: recentEvents.length,
      events: recentEvents.slice(0, 50).map((e) => ({
        magnitude: e.magnitude,
        latitude: e.latitude,
        longitude: e.longitude,
        depth: e.depth,
        location: e.location || e.place || "Unknown",
        dateTime: e.dateTimeStr || new Date(e.time).toISOString(),
        source: e.source,
      })),
      maxMagnitude:
        recentEvents.length > 0
          ? Math.max(...recentEvents.map((e) => e.magnitude))
          : 0,
      avgMagnitude:
        recentEvents.length > 0
          ? (
              recentEvents.reduce((sum, e) => sum + e.magnitude, 0) /
              recentEvents.length
            ).toFixed(2)
          : "0.00",
    };

    // ✅ Create Gemini prompt
    const prompt = `You are an expert seismologist analyzing earthquake data for the Philippines region.

Analyze the following earthquake events recorded in the past 24 hours.

Total Events: ${summary.totalEvents}
Maximum Magnitude: ${summary.maxMagnitude}
Average Magnitude: ${summary.avgMagnitude}

Recent Events:
${JSON.stringify(summary.events, null, 2)}

Provide:
1. Seismic activity level (Low, Moderate, High, or Critical)
2. Patterns or clusters you observe
3. Areas of concern (e.g., provinces, regions)
4. Public awareness and safety tips for people in the affected areas.`;

    // ✅ Use Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const analysis = result.response.text();

    console.log("✅ Gemini analysis completed");

    // ✅ Determine simple risk level based on magnitude & event count
    let riskLevel = "low";
    if (summary.maxMagnitude >= 6.0) {
      riskLevel = "critical";
    } else if (summary.maxMagnitude >= 5.0 || summary.totalEvents > 20) {
      riskLevel = "high";
    } else if (summary.maxMagnitude >= 4.0 || summary.totalEvents > 10) {
      riskLevel = "moderate";
    }

    // ✅ Save AI analysis to Firebase
    const analysisData = {
      analysis,
      riskLevel,
      timestamp: Date.now(),
      summary: {
        totalEvents: summary.totalEvents,
        maxMagnitude: summary.maxMagnitude,
        avgMagnitude: summary.avgMagnitude,
      },
      generatedAt: new Date().toISOString(),
    };

    await db.ref("aiAnalysis/last").set(analysisData);
    await db.ref(`aiAnalysis/history/${Date.now()}`).set(analysisData);

    console.log(`📊 Risk Level: ${riskLevel.toUpperCase()}`);
    console.log("💾 Analysis saved to Firebase");

    return analysisData;
  } catch (err) {
    console.error("❌ Gemini analysis error:", err.message);

    await db.ref("aiAnalysis/last").set({
      error: err.message,
      timestamp: Date.now(),
      riskLevel: "unknown",
    });

    throw err;
  }
}

module.exports = { analyzeWithGemini };
