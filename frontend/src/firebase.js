import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBjUlMOntVrvq9bJ2lSfKhWZWk8owDzuJA",
  authDomain: "upuccofficialid.firebaseapp.com",
  projectId: "upuccofficialid",
  storageBucket: "upuccofficialid.firebasestorage.app",
  messagingSenderId: "158283728994",
  appId: "1:158283728994:web:fd59daa88e00bc275a293b",
  measurementId: "G-MZJDW6WHCE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, analytics, db, auth, storage };
