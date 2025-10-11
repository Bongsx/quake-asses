import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

let serviceAccount;

try {
  const saPath = process.env.SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";

  if (fs.existsSync(saPath)) {
    // Local file
    serviceAccount = JSON.parse(fs.readFileSync(path.resolve(saPath), "utf8"));
    console.log("✅ Loaded Firebase service account from local file");
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Vercel env variable
    const jsonString = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    serviceAccount = JSON.parse(jsonString);
    console.log("✅ Loaded Firebase service account from environment variable");
  } else {
    throw new Error("❌ No service account found. Check configuration.");
  }
} catch (err) {
  console.error(
    "🔥 Failed to load or parse Firebase service account:",
    err.message
  );
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
