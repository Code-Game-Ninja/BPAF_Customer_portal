import {
  initializeApp,
  getApps,
  cert,
  type ServiceAccount,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin SDK credentials not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }
  const serviceAccount: ServiceAccount = { projectId, clientEmail, privateKey };
  return initializeApp({ credential: cert(serviceAccount) });
}

export function getAdminAuth(): Auth {
  if (!_adminAuth) {
    if (!adminApp) adminApp = getAdminApp();
    _adminAuth = getAuth(adminApp);
  }
  return _adminAuth;
}

export function getAdminDb(): Firestore {
  if (!_adminDb) {
    if (!adminApp) adminApp = getAdminApp();
    _adminDb = getFirestore(adminApp);
  }
  return _adminDb;
}
