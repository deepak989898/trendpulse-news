"use client";

import { FormEvent, useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("Subscribing...");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setStatus(res.ok ? "Subscribed!" : "Failed. Try again.");
    if (res.ok) setEmail("");
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
      <h3 className="mb-2 font-semibold">Newsletter</h3>
      <div className="flex gap-2">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Join</button>
      </div>
      <p className="mt-2 text-xs text-zinc-500">{status}</p>
    </form>
  );
}
