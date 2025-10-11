// firebase-admin.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

let serviceAccount = null;

// 🗂️ Path for local JSON
const saPath = process.env.SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";

try {
  if (fs.existsSync(saPath)) {
    // 🖥️ Local environment (file)
    serviceAccount = JSON.parse(fs.readFileSync(path.resolve(saPath), "utf8"));
    console.log("✅ Loaded Firebase service account from local file");
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    // ☁️ Vercel Base64 environment
    const decoded = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      "base64"
    ).toString("utf8");
    serviceAccount = JSON.parse(decoded);
    console.log(
      "✅ Loaded Firebase service account from Base64 environment variable"
    );
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // (Optional fallback if JSON string)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log(
      "✅ Loaded Firebase service account from JSON environment variable"
    );
  } else {
    throw new Error("❌ No Firebase service account found.");
  }
} catch (error) {
  console.error(
    "🔥 Failed to load or parse Firebase service account:",
    error.message
  );
  process.exit(1);
}

// 🚀 Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL,
  });
}

export const db = admin.database();
export { admin };
