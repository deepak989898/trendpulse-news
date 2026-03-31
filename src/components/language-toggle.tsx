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
    <div className="flex items-center rounded-full border text-xs">
      <button type="button" onClick={() => update("hi")} className={`px-2 py-1 ${lang === "hi" ? "bg-zinc-200 dark:bg-zinc-700" : ""}`}>
        HI
      </button>
      <button type="button" onClick={() => update("en")} className={`px-2 py-1 ${lang === "en" ? "bg-zinc-200 dark:bg-zinc-700" : ""}`}>
        EN
      </button>
    </div>
  );
}
