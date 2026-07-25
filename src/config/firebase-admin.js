const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

try {
  if (admin.apps.length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialized via environment variable.");
    } else {
      const filePath = path.join(__dirname, "serviceAccountKey.json");

      if (fs.existsSync(filePath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(filePath, "utf8"));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log("✅ Firebase Admin initialized via serviceAccountKey.json file.");
      } else {
        console.warn("⚠️ No Firebase service account found. Google login disabled.");
      }
    }
  }
} catch (error) {
  console.error("❌ Firebase Admin initialization failed:", error.message);
}

module.exports = admin;