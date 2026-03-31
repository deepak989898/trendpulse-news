"use client";

import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase-client";

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
      if (!firebaseAuth) throw new Error("Missing Firebase client configuration");
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const token = await credential.user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error("Session create failed");
      router.push("/admin");
    } catch {
      setError("Invalid credentials.");
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
