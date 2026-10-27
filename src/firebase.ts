// Import the functions you need from the SDKs you need
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAeoAigEzdZu_YPXALBIGlrw4QbYSRkSuk",
  authDomain: "vinayaga-plates-management.firebaseapp.com",
  projectId: "vinayaga-plates-management",
  storageBucket: "vinayaga-plates-management.firebasestorage.app",
  messagingSenderId: "954927948405",
  appId: "1:954927948405:web:2b3f0ea594115a6bf94e3c",
  measurementId: "G-904C6DL8J9"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Analytics (checking for support since it may not run in WebView/Capacitor environment)
let analytics: Analytics | null = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export { app, analytics };
