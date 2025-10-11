// firebase-admin.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

let serviceAccount;

try {
  const saPath = process.env.SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";

  if (fs.existsSync(saPath)) {
    // 🖥️ Local
    serviceAccount = JSON.parse(fs.readFileSync(path.resolve(saPath), "utf8"));
    console.log("✅ Loaded Firebase service account from local file");
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    // ☁️ Vercel Base64
    const decoded = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.trim(),
      "base64"
    ).toString("utf8");

    // ensure it's valid JSON
    serviceAccount = JSON.parse(decoded);
    console.log(
      "✅ Loaded Firebase service account from Base64 environment variable"
    );
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
