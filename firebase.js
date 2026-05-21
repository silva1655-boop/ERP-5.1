import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyA3V4tMMUlho_pKrQjxdC7R98sOYZJQ4GA",
  authDomain: "mantek-erp.firebaseapp.com",
  projectId: "mantek-erp",
  storageBucket: "mantek-erp.firebasestorage.app",
  messagingSenderId: "112584321289",
  appId: "1:112584321289:web:8a6be54be443123bb34bd8",
  measurementId: "G-T8V8SQFRR7"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
