// config/firebase.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

/**
 * Replace these with your actual Firebase project credentials
 * (from Firebase Console → Project settings)
 */
const firebaseConfig = {
  apiKey: "AIzaSyC4X-Ah9-PDzMF9-tlf_KI04cQu4CVGtjU",
  authDomain: "dsi-anthropometry.firebaseapp.com",
  projectId: "dsi-anthropometry",
  storageBucket: "dsi-anthropometry.firebasestorage.app",
  messagingSenderId: "952990352324",
  appId: "1:952990352324:web:452080a4ea4e58f1deda91",
  measurementId: "G-ELHVNZTC7Z"
};

// Prevent double initialization (useful during Expo fast refresh)
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app as firebaseApp, auth, db, storage };
