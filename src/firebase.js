// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = initializeApp(firebaseConfig);

// Initialize Analytics (checking for support since it may not run in WebView/Capacitor environment)
let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export { app, analytics };
