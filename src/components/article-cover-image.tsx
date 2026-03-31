"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { getFallbackCoverChain } from "@/lib/article-image";

type Props = {
  articleId: string;
  src: string;
  alt: string;
  className?: string;
};

export function ArticleCoverImage({ articleId, src, alt, className }: Props) {
  const chain = useMemo(() => {
    const fallbacks = getFallbackCoverChain(articleId, src);
    return [src, ...fallbacks];
  }, [articleId, src]);

  const [index, setIndex] = useState(0);

  if (index >= chain.length) {
    return (
      <div
        className={`flex h-48 w-full items-center justify-center bg-gradient-to-br from-zinc-200 to-zinc-400 text-zinc-600 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-400 ${className ?? ""}`}
        role="img"
        aria-label={alt}
      >
        <span className="max-w-[90%] px-2 text-center text-xs font-medium line-clamp-3">{alt}</span>
      </div>
    );
  }

  const current = chain[index];

  return (
    <Image
      key={current}
      src={current}
      alt={alt}
      width={1200}
      height={700}
      className={className}
      loading="lazy"
      unoptimized={current.includes("picsum.photos")}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
