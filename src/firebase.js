// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCOvNzdoiBjG9A-a0S-gp1QlZ0yqfQcrWU",
  authDomain: "test-9df88.firebaseapp.com",
  projectId: "test-9df88",
  storageBucket: "test-9df88.firebasestorage.app",
  messagingSenderId: "751328612024",
  appId: "1:751328612024:web:0fcfec9eb2e570da572e4d",
  measurementId: "G-HGJWE7C09Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);