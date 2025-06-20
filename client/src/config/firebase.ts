import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCqDlIxPDp-QU6mzthkWnmzM6rZ8rnJdiI",
  authDomain: "dev1-b3973.firebaseapp.com",
  projectId: "dev1-b3973",
  storageBucket: "dev1-b3973.firebasestorage.app",
  messagingSenderId: "658150387877",
  appId: "1:658150387877:web:ac90e7b1597a45258f5d4c",
  measurementId: "G-7W2BNH8MQ7"
};

// Firebase is now configured with live credentials
const isFirebaseConfigured = true;

// Initialize Firebase with live credentials
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('✅ Firebase initialized successfully with live configuration');

export { storage, auth, db, isFirebaseConfigured };
export default app;