import admin from "firebase-admin"

export function initializeAdminApp() {
  try {
    // Use service account if provided in env
    const serviceAccount = process.env.FIREBASE_ADMIN_CREDENTIALS 
      ? JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS)
      : undefined

    return admin.initializeApp({
      credential: serviceAccount 
        ? admin.credential.cert(serviceAccount)
        : admin.credential.applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID // Your project ID from .env.local
    })
  } catch (err) {
    console.error("Failed to initialize Firebase Admin:", err)
    throw err
  }
}