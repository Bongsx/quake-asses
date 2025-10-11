// firebase-admin.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

let serviceAccount = null;

// 🗂️ Path to local JSON file
const saPath = process.env.SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";

try {
  if (fs.existsSync(saPath)) {
    // 🖥️ Local environment
    serviceAccount = JSON.parse(fs.readFileSync(path.resolve(saPath), "utf8"));
    console.log("✅ Loaded Firebase service account from local file");
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // ☁️ Vercel environment — may contain escaped JSON
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log("✅ Loaded Firebase service account from JSON env variable");
    } catch (err) {
      // Handle common escape issues (e.g., double-escaped quotes)
      console.warn(
        "⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT directly, trying to fix escape issues..."
      );
      const fixed = process.env.FIREBASE_SERVICE_ACCOUNT.replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/^"|"$/g, "");
      serviceAccount = JSON.parse(fixed);
      console.log(
        "✅ Loaded Firebase service account after fixing escape issues"
      );
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    // 🧩 Base64 encoded version (safe for Vercel)
    const decoded = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      "base64"
    ).toString("utf8");
    serviceAccount = JSON.parse(decoded);
    console.log("✅ Loaded Firebase service account from base64 variable");
  } else {
    throw new Error("❌ No service account found. Check your configuration.");
  }
} catch (error) {
  console.error(
    "🔥 Failed to load or parse Firebase service account:",
    error.message
  );
  process.exit(1);
}

// 🚀 Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL,
  });
}

export const db = admin.database();
export { admin };
