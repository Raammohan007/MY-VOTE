// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Uses environment variables if available, falls back to hardcoded values
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAQ8bUvjKmICrVydX280QHyP4QN9ymmS2Q",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "voting-system-94b24.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "voting-system-94b24",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "voting-system-94b24.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "754528261378",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:754528261378:web:00578b7188c1225e105e1b",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-63DXNHZNQ3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);