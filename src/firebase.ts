import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const { firestoreDatabaseId, ...appConfig } = firebaseConfig as any;
const app = initializeApp(appConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with offline persistence and correct database ID
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, firestoreDatabaseId || '(default)');

