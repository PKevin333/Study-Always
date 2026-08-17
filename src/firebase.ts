import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const { firestoreDatabaseId, ...appConfig } = firebaseConfig as any;
const app = initializeApp(appConfig);

// Initialize Auth
export const auth = getAuth(app);
void setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting Firebase Auth persistence:', error);
});

// Initialize Firestore with offline persistence and correct database ID
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, firestoreDatabaseId || '(default)');
