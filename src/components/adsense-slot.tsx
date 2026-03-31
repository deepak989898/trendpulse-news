"use client";

import { useEffect } from "react";

type Props = { slot: string; className?: string };

export function AdSenseSlot({ slot, className }: Props) {
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).adsbygoogle.push({});
    } catch {
      // no-op in local/dev
    }
  }, []);

  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT) return null;

  return (
    <ins
      className={`adsbygoogle block min-h-24 ${className ?? ""}`}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
