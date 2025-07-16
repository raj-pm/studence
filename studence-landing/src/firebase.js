// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDOxUXB9P1AC-o_DEDJaL1T4uo3V9EUrWs",
  authDomain: "studence-39e4f.firebaseapp.com",
  projectId: "studence-39e4f",
  storageBucket: "studence-39e4f.firebasestorage.app",
  messagingSenderId: "332301180805",
  appId: "1:332301180805:web:cf7d82fb12706b5cbaeeec",
  measurementId: "G-14BYWV92SD"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider(); // ✅ Add this line
