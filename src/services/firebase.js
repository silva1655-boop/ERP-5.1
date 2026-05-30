import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseEnvKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const rawFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const missingFirebaseEnvKeys = firebaseEnvKeys.filter(key => !import.meta.env[key]);
export const isFirebaseConfigured = missingFirebaseEnvKeys.length === 0;

const fallbackFirebaseConfig = {
  apiKey: 'missing-firebase-api-key',
  authDomain: 'missing-firebase-config.firebaseapp.com',
  projectId: 'missing-firebase-config',
  storageBucket: 'missing-firebase-config.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:missingfirebaseconfig',
};

if (!isFirebaseConfigured) {
  console.warn(`Firebase no está configurado. Variables faltantes: ${missingFirebaseEnvKeys.join(', ')}`);
}

export const firebaseConfig = isFirebaseConfigured ? rawFirebaseConfig : fallbackFirebaseConfig;
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
});
export const storage = getStorage(app);

if (isFirebaseConfigured) {
  setPersistence(auth, browserLocalPersistence).catch(error => {
    if (import.meta.env.DEV) console.error('No se pudo configurar persistencia de sesión', error);
  });
}
