// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA53i6of0C1P_ZEWa05N792IizSD8kf2KY",
  authDomain: "medqtrack-8316f.firebaseapp.com",
  projectId: "medqtrack-8316f",
  storageBucket: "medqtrack-8316f.firebasestorage.app",
  messagingSenderId: "308758176740",
  appId: "1:308758176740:web:aa14cbe94e9f4cba9e1df1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);