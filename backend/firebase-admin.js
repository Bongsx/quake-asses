// firebase-admin.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

let serviceAccount = null;

// Check if the JSON file exists locally
const saPath = process.env.SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";

if (fs.existsSync(saPath)) {
  // 🖥️ Local environment (with file)
  serviceAccount = JSON.parse(fs.readFileSync(path.resolve(saPath), "utf8"));
  console.log("✅ Loaded Firebase service account from local file");
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // ☁️ Vercel environment (from env variable)
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  console.log("✅ Loaded Firebase service account from environment variable");
} else {
  console.error("❌ No service account found. Check your configuration.");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL,
  });
}

export const db = admin.database();
export { admin };
