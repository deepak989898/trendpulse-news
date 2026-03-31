import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function normalizePrivateKey(): string {
  const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64?.trim();
  if (b64) {
    const decoded = Buffer.from(b64, "base64").toString("utf8").trim();
    if (!decoded.includes("BEGIN PRIVATE KEY")) {
      throw new Error("FIREBASE_PRIVATE_KEY_BASE64 decoded value is not a valid PEM private key.");
    }
    return decoded;
  }

  let raw = process.env.FIREBASE_PRIVATE_KEY ?? "";
  raw = raw.trim();
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1).trim();
  }
  while (raw.includes("\\\\n")) {
    raw = raw.replace(/\\\\n/g, "\\n");
  }
  let key = raw.replace(/\\n/g, "\n");

  if (!key.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY must contain -----BEGIN PRIVATE KEY----- or use FIREBASE_PRIVATE_KEY_BASE64.",
    );
  }

  return key;
}

function adminApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = normalizePrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables.");
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function getAdminAuth() {
  return getAuth(adminApp());
}

export function getAdminDb() {
  return getFirestore(adminApp());
}
