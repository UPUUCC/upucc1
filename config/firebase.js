const admin = require('firebase-admin');

// IMPORTANT: Replace this with your own service account key from Firebase Console -> Project Settings -> Service Accounts
// You can download the JSON file, save it as 'serviceAccountKey.json' in the config folder.
try {
  const serviceAccount = require('./serviceAccountKey.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "your-project-id.appspot.com" // Replace with your Firebase Storage bucket URL
  });

  console.log("Firebase Admin initialized successfully.");
} catch (error) {
  console.warn("Firebase Admin failed to initialize. Please ensure serviceAccountKey.json exists and is valid.");
  console.warn(error.message);
  
  // Dummy initialization so the app doesn't crash completely during setup
  if (admin.apps.length === 0) {
      admin.initializeApp();
  }
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = { admin, db, auth, storage };
