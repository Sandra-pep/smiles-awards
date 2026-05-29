import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBP3YxQaq_1zScdvEo0rLqdi274CFvuYo8",
  authDomain: "smiles-awards.firebaseapp.com",
  projectId: "smiles-awards",
  storageBucket: "smiles-awards.firebasestorage.app",
  messagingSenderId: "557791199573",
  appId: "1:557791199573:web:1cb1fc2e371e626adaafdc"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);