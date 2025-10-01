
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// --- START OF FIREBASE CONFIGURATION ---
// IMPORTANT: This is a placeholder configuration. You must replace it
// with your own Firebase project's configuration details.
//
// How to get your Firebase config:
// 1. Go to your Firebase project console: https://console.firebase.google.com/
// 2. In the left sidebar, click on Project Overview (the gear icon) > Project settings.
// 3. In the "Your apps" card, select the web app you created for this project.
// 4. Under "Firebase SDK snippet", select "Config" and copy the firebaseConfig object.
// 5. Paste the copied object here, replacing the placeholder object below.
//
// For this app to work, all fields (apiKey, authDomain, etc.) must be valid.
const firebaseConfig = {
  apiKey: "AIzaSyAl_20TrZIDkJeTV3AcAU295dIbsUnBimg",
  authDomain: "arbolado-chajari.firebaseapp.com",
  projectId: "arbolado-chajari",
  storageBucket: "arbolado-chajari.firebasestorage.app",
  messagingSenderId: "1027728914509",
  appId: "1:1027728914509:web:d1f7497614c32181cb0404"
};
// --- END OF FIREBASE CONFIGURATION ---


// We wrap the initialization in a function to control the export
// and prevent undefined exports if initialization fails.
function initializeFirebaseServices() {
  try {
    // Check if placeholder values are still there.
    if (firebaseConfig.apiKey.startsWith("PASTE_")) {
      throw new Error("Firebase configuration is not set. Please update services/firebase.ts with your project's credentials.");
    }

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);

    // Get services
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);
    const googleProvider = new GoogleAuthProvider();

    return { auth, db, storage, googleProvider };

  } catch (error) {
    console.error("Firebase initialization failed:", error);
    alert("Could not connect to the database. Please check the Firebase configuration in services/firebase.ts and ensure you have replaced the placeholder values with your actual project credentials.");
    // This error will stop the app from loading entirely, making the configuration issue much clearer.
    throw new Error("Firebase initialization failed. The application cannot start.");
  }
}

// Initialize and export the services.
// If initialization fails, this will throw and halt the app load.
const { auth, db, storage, googleProvider } = initializeFirebaseServices();

export { auth, db, storage, googleProvider };
