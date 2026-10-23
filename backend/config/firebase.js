const admin = require('firebase-admin');

try {
  // If you have a service account key, require it here.
  // const serviceAccount = require('./serviceAccountKey.json');
  
  // admin.initializeApp({
  //   credential: admin.credential.cert(serviceAccount)
  // });
  
  // For now, if no service account is provided, initialize empty (for local emulator or default creds)
  admin.initializeApp();
  console.log("Firebase Admin initialized successfully.");
} catch (error) {
  console.warn("Firebase Admin failed to initialize.");
  console.warn(error.message);
}

const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');

const db = getFirestore();
const auth = getAuth();
const storage = getStorage();

module.exports = { admin, db, auth, storage };
