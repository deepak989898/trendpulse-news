"use client";

import { useState } from "react";

type Props = { defaultLang: "hi" | "en" };

export function LanguageToggle({ defaultLang }: Props) {
  const [lang, setLang] = useState<"hi" | "en">(defaultLang);

  async function update(next: "hi" | "en") {
    setLang(next);
    await fetch("/api/preferences/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: next }),
    });
    window.location.reload();
  }

  return (
    <div className="flex items-center overflow-hidden rounded-full border border-zinc-300 text-xs font-medium text-zinc-800 dark:border-zinc-600 dark:text-zinc-100">
      <button
        type="button"
        onClick={() => update("hi")}
        className={`px-2.5 py-1.5 transition-colors ${lang === "hi" ? "bg-zinc-200 dark:bg-zinc-700" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
      >
        HI
      </button>
      <button
        type="button"
        onClick={() => update("en")}
        className={`px-2.5 py-1.5 transition-colors ${lang === "en" ? "bg-zinc-200 dark:bg-zinc-700" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
      >
        EN
      </button>
    </div>
  );
}
