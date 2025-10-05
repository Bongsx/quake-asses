// utils/phivolcsScraper.js - WITH 24-HOUR FILTER
const axios = require("axios");
const cheerio = require("cheerio");
const https = require("https");

// Create custom HTTPS agent that bypasses SSL verification for PHIVOLCS
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

/**
 * Scrapes PHIVOLCS earthquake data from their website
 * Only returns events from the last 24 hours
 * @returns {Array} Array of earthquake events
 */
async function scrapePHIVOLCS() {
  try {
    console.log("🇵🇭 Scraping PHIVOLCS data (last 24 hours)...");

    const url = "https://earthquake.phivolcs.dost.gov.ph/";
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      httpsAgent: httpsAgent,
    });

    const $ = cheerio.load(response.data);
    const events = [];

    // Only fetch events from last 24 hours
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    console.log("📄 HTML loaded, searching for tables...");

    // Try different table selectors
    let rows;
    if ($("table#quakeinfo tbody tr").length > 0) {
      rows = $("table#quakeinfo tbody tr");
      console.log(`✓ Found quakeinfo table with ${rows.length} rows`);
    } else if ($("table tbody tr").length > 0) {
      rows = $("table tbody tr");
      console.log(`✓ Found generic table with ${rows.length} rows`);
    } else if ($("table tr").length > 0) {
      rows = $("table tr");
      console.log(`✓ Found table rows (no tbody): ${rows.length} rows`);
    } else {
      console.log("❌ No table rows found!");
      return [];
    }

    let skippedOld = 0;
    let skippedInvalid = 0;

    // Process rows
    rows.each((index, element) => {
      try {
        const cols = $(element).find("td");

        if (cols.length < 5) {
          skippedInvalid++;
          return;
        }

        // Extract data from table columns
        const dateTimeStr = $(cols[0]).text().trim();
        const latStr = $(cols[1]).text().trim();
        const lonStr = $(cols[2]).text().trim();
        const depthStr = $(cols[3]).text().trim();
        const magStr = $(cols[4]).text().trim();
        const location =
          cols.length > 5 ? $(cols[5]).text().trim() : "Philippines";

        const latitude = parseFloat(latStr);
        const longitude = parseFloat(lonStr);
        const depth = parseFloat(depthStr);
        const magnitude = parseFloat(magStr);

        // Parse Philippine time (PST = UTC+8)
        const dateTime = parsePHIVOLCSDate(dateTimeStr);

        if (!dateTime || isNaN(latitude) || isNaN(longitude)) {
          skippedInvalid++;
          return;
        }

        // Skip events older than 24 hours
        if (dateTime.getTime() < twentyFourHoursAgo) {
          skippedOld++;
          return;
        }

        // Create unique ID (replace dots with underscores for Firebase)
        const latForId = latitude.toFixed(2).replace(".", "_");
        const lonForId = longitude.toFixed(2).replace(".", "_");
        const id = `phivolcs_${dateTime.getTime()}_${latForId}_${lonForId}`;

        const event = {
          id,
          source: "phivolcs",
          magnitude: magnitude || 0,
          latitude,
          longitude,
          depth: depth || 0,
          time: dateTime.getTime(),
          place: location || "Philippines",
          type: "earthquake",
          url: url,
          raw: {
            dateTimeStr,
            location,
          },
        };

        events.push(event);
      } catch (err) {
        console.error(`❌ Error parsing row ${index}:`, err.message);
      }
    });

    console.log(
      `\n✅ Scraped ${events.length} events from PHIVOLCS (last 24 hours)`
    );
    console.log(
      `📅 Filtering from: ${new Date(twentyFourHoursAgo).toISOString()}`
    );
    console.log(`⏭️  Skipped ${skippedOld} old events (>24h)`);
    console.log(`❌ Skipped ${skippedInvalid} invalid rows`);

    return events;
  } catch (err) {
    console.error("❌ PHIVOLCS scraping error:", err.message);
    if (err.response) {
      console.error("Response status:", err.response.status);
    }
    if (err.code) {
      console.error("Error code:", err.code);
    }
    return [];
  }
}

/**
 * Parse PHIVOLCS date format: "05 October 2025 - 02:28 PM"
 * Philippine Standard Time (PST = UTC+8)
 */
function parsePHIVOLCSDate(dateStr) {
  try {
    const match = dateStr.match(
      /(\d{2})\s+(\w+)\s+(\d{4})\s+-\s+(\d{2}):(\d{2})\s+(AM|PM)/i
    );

    if (!match) {
      return null;
    }

    const [, day, month, year, hour, minute, period] = match;

    const months = {
      january: 0,
      february: 1,
      march: 2,
      april: 3,
      may: 4,
      june: 5,
      july: 6,
      august: 7,
      september: 8,
      october: 9,
      november: 10,
      december: 11,
    };

    let hours = parseInt(hour);
    if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (period.toUpperCase() === "AM" && hours === 12) hours = 0;

    // Create date object - treating input as UTC+8 (Philippine Time)
    // JavaScript Date constructor uses local time, so we need to adjust
    const pstDate = new Date(
      parseInt(year),
      months[month.toLowerCase()],
      parseInt(day),
      hours,
      parseInt(minute),
      0
    );

    // Since the date was created in local time but represents PST,
    // we need to convert it to UTC properly
    // PST is UTC+8, so we subtract 8 hours to get UTC timestamp
    const utcTimestamp = pstDate.getTime() - 8 * 60 * 60 * 1000;

    return new Date(utcTimestamp);
  } catch (err) {
    return null;
  }
}

module.exports = { scrapePHIVOLCS };
