import { applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';

function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    return initializeApp({
      credential: cert(JSON.parse(serviceAccountJson))
    });
  }

  return initializeApp({
    credential: applicationDefault()
  });
}

export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken> {
  return getAuth(getFirebaseAdminApp()).verifyIdToken(idToken);
}
