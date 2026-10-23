const { initializeApp, getApps, getApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');

let app;
try {
  // If you have a service account key, uncomment and use it here.
  // const { cert } = require('firebase-admin/app');
  // const serviceAccount = require('./serviceAccountKey.json');
  // app = initializeApp({ credential: cert(serviceAccount) });

  // For now, initialize empty (for local emulator or default creds)
  if (getApps().length === 0) {
    app = initializeApp();
  } else {
    app = getApp();
  }
  console.log("Firebase Admin initialized successfully.");
} catch (error) {
  console.warn("Firebase Admin failed to initialize.");
  console.warn(error.message);
  if (getApps().length > 0) app = getApp();
}

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

module.exports = { app, db, auth, storage };
