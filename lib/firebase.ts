import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let app: App | null = null;
let firestoreDb: Firestore | null = null;

export function getFirestoreDb(): Firestore {
  if (firestoreDb) return firestoreDb;

  if (!getApps().length) {
    let credentialCert = null;

    // 1. Check environment variable for production (Vercel / Cloud)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
        const jsonStr = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(jsonStr);
        credentialCert = cert(serviceAccount);
      } catch (err) {
        console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY env var:', err);
      }
    }

    // 2. Check local service account file
    if (!credentialCert) {
      const localKeyPath = path.join(process.cwd(), 'firebase-service-account.json');
      if (fs.existsSync(localKeyPath)) {
        try {
          const serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
          credentialCert = cert(serviceAccount);
        } catch (err) {
          console.warn('Failed to load local firebase-service-account.json:', err);
        }
      }
    }

    app = initializeApp({
      credential: credentialCert || undefined,
      projectId: 'creative-associate-llp-9d611',
    });
  } else {
    app = getApps()[0];
  }

  firestoreDb = getFirestore(app);
  return firestoreDb;
}

export { firestoreDb };
