"use client";

export function SocialShare({ title }: { title: string }) {
  const url = typeof window === "undefined" ? "" : window.location.href;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <span className="text-sm text-zinc-500">Share:</span>
      <a
        className="rounded border px-3 py-1 text-sm"
        target="_blank"
        rel="noreferrer"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
      >
        X
      </a>
      <a
        className="rounded border px-3 py-1 text-sm"
        target="_blank"
        rel="noreferrer"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
      >
        Facebook
      </a>
      <a
        className="rounded border px-3 py-1 text-sm"
        target="_blank"
        rel="noreferrer"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
      >
        LinkedIn
      </a>
    </div>
  );
}
