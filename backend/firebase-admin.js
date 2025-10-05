// firebase-admin.js (clean ES module version)
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const saPath = process.env.SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";

if (!fs.existsSync(saPath)) {
  console.error(`❌ Service account not found at: ${saPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(path.resolve(saPath), "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL,
});

export const db = admin.database();
export { admin };
