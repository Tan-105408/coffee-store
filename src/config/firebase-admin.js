const { initializeApp, cert } = require("firebase-admin/app");
const path = require("path");
const fs = require("fs");

let app;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    app = initializeApp({
      credential: cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized via environment variable.");
  } else {
    const filePath = path.join(__dirname, "serviceAccountKey.json");
    
    if (fs.existsSync(filePath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(filePath, "utf8"));
      app = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialized via serviceAccountKey.json file.");
    } else {
      throw new Error(`Service account file not found at: ${filePath}`);
    }
  }
} catch (error) {
  console.error("❌ Firebase Admin initialization failed:", error.message);
}

module.exports = app;