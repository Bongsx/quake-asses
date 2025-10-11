const axios = require("axios");
const cheerio = require("cheerio");
const https = require("https");

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
async function scrapePHIVOLCS(retries = 3) {
  const url = "https://earthquake.phivolcs.dost.gov.ph/";
  const axiosConfig = {
    timeout: 30000, // 30 seconds
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
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🇵🇭 Scraping PHIVOLCS data (attempt ${attempt})...`);
      const response = await axios.get(url, axiosConfig);
      const $ = cheerio.load(response.data);
      const events = [];
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

      let rows;
      if ($("table#quakeinfo tbody tr").length > 0) {
        rows = $("table#quakeinfo tbody tr");
      } else if ($("table tbody tr").length > 0) {
        rows = $("table tbody tr");
      } else if ($("table tr").length > 0) {
        rows = $("table tr");
      } else {
        console.log("❌ No table rows found!");
        return [];
      }

      let skippedOld = 0;
      let skippedInvalid = 0;

      rows.each((index, element) => {
        try {
          const cols = $(element).find("td");
          if (cols.length < 5) {
            skippedInvalid++;
            return;
          }

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

          const dateTime = parsePHIVOLCSDate(dateTimeStr);

          if (!dateTime || isNaN(latitude) || isNaN(longitude)) {
            skippedInvalid++;
            return;
          }

          if (dateTime.getTime() < twentyFourHoursAgo) {
            skippedOld++;
            return;
          }

          const latForId = latitude.toFixed(2).replace(".", "_");
          const lonForId = longitude.toFixed(2).replace(".", "_");
          const id = `phivolcs_${dateTime.getTime()}_${latForId}_${lonForId}`;

          events.push({
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
          });
        } catch (err) {
          skippedInvalid++;
        }
      });

      console.log(
        `\n✅ Scraped ${events.length} events from PHIVOLCS (last 24 hours)`
      );
      console.log(`⏭️ Skipped ${skippedOld} old events (>24h)`);
      console.log(`❌ Skipped ${skippedInvalid} invalid rows`);

      return events;
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        console.warn(`⏳ Timeout on attempt ${attempt}. Retrying...`);
      } else {
        console.error("❌ PHIVOLCS scraping error:", err.message);
        if (err.response)
          console.error("Response status:", err.response.status);
        if (err.code) console.error("Error code:", err.code);
        throw err;
      }
    }
  }

  throw new Error(`❌ Failed to scrape PHIVOLCS after ${retries} attempts.`);
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
