"use client";

import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase-client";

function getFriendlyError(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/invalid-credential") return "Invalid email/password, or this email is not enabled in Firebase Auth.";
    if (error.code === "auth/user-not-found") return "User not found in Firebase Auth.";
    if (error.code === "auth/wrong-password") return "Wrong password.";
    if (error.code === "auth/invalid-api-key") return "Firebase API key is invalid. Check NEXT_PUBLIC_FIREBASE_API_KEY.";
    if (error.code === "auth/network-request-failed") return "Network error while contacting Firebase Auth.";
    return `Firebase error: ${error.code}`;
  }
  if (error instanceof Error) return error.message;
  return "Login failed. Check Firebase Auth config and credentials.";
}

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const firebaseAuth = getFirebaseAuth();
      if (!firebaseAuth) {
        throw new Error("Missing Firebase client config. Set NEXT_PUBLIC_FIREBASE_* in Vercel.");
      }
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const token = await credential.user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: "Session create failed" }));
        throw new Error(payload.error ?? "Session create failed");
      }
      router.push("/admin");
    } catch (err) {
      setError(getFriendlyError(err));
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-10 max-w-md rounded-xl border bg-white p-6 dark:bg-zinc-900">
      <h1 className="mb-4 text-2xl font-bold">Admin Login</h1>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="mb-3 w-full rounded-lg border px-3 py-2"
      />
      <input
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="mb-3 w-full rounded-lg border px-3 py-2"
      />
      <button className="w-full rounded-lg bg-blue-600 px-3 py-2 text-white">Sign In</button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
