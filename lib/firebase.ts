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
        const jsonStr = raw.startsWith('{')
          ? raw
          : Buffer.from(raw.replace(/\s+/g, ''), 'base64').toString('utf8');
        const serviceAccount = JSON.parse(jsonStr);
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        credentialCert = cert(serviceAccount);
        console.log('[Firebase Init] Successfully created credential cert for project:', serviceAccount.project_id);
      } catch (err: any) {
        console.warn('[Firebase Init] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', err.message);
      }
    } else {
      console.warn('[Firebase Init] process.env.FIREBASE_SERVICE_ACCOUNT_KEY is not defined!');
    }

    // 2. Check local service account file
    if (!credentialCert) {
      const localKeyPath = path.join(process.cwd(), 'firebase-service-account.json');
      if (fs.existsSync(localKeyPath)) {
        try {
          const serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
          if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
          }
          credentialCert = cert(serviceAccount);
          console.log('[Firebase Init] Successfully loaded local service account file');
        } catch (err: any) {
          console.warn('[Firebase Init] Failed to load local firebase-service-account.json:', err.message);
        }
      }
    }

    if (!credentialCert) {
      console.warn('[Firebase Init] WARNING: No Firebase credentials found. Cloud sync disabled.');
      return null as any;
    }

    app = initializeApp({
      credential: credentialCert,
      projectId: 'creative-associate-llp-9d611',
    });
  } else {
    app = getApps()[0];
  }

  firestoreDb = getFirestore(app);
  return firestoreDb;
}

export { firestoreDb };
