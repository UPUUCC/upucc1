const { initializeApp, getApps, getApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');

// IMPORTANT: Replace this with your own service account key from Firebase Console -> Project Settings -> Service Accounts
// You can download the JSON file, save it as 'serviceAccountKey.json' in the config folder.
let app;
try {
  const serviceAccount = require('./serviceAccountKey.json');

  if (getApps().length === 0) {
    app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: "your-project-id.appspot.com" // Replace with your Firebase Storage bucket URL
    });
  } else {
    app = getApp();
  }

  console.log("Firebase Admin initialized successfully.");
} catch (error) {
  console.warn("Firebase Admin failed to initialize. Please ensure serviceAccountKey.json exists and is valid.");
  console.warn(error.message);

  // Dummy initialization so the app doesn't crash completely during setup
  if (getApps().length === 0) {
    app = initializeApp();
  } else {
    app = getApp();
  }
}

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

module.exports = { app, db, auth, storage };
