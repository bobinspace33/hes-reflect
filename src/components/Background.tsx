"use client";

import { useEffect, useState } from "react";

const KNOWN_BACKGROUNDS = [
  "/backgrounds/background5.png",
  "/backgrounds/background4.png",
  "/backgrounds/background3.png",
  "/backgrounds/background2.png",
  "/backgrounds/Slide 16_9 - 22.png",
];

export function Background({ src }: { src?: string }) {
  const [resolved, setResolved] = useState<string | null>(src ?? null);

  useEffect(() => {
    if (src) return;
    // Probe in priority order; use the first that loads.
    let cancelled = false;
    (async () => {
      for (const candidate of KNOWN_BACKGROUNDS) {
        const ok = await new Promise<boolean>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = encodeURI(candidate);
        });
        if (cancelled) return;
        if (ok) {
          setResolved(encodeURI(candidate));
          return;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <div className="fixed inset-0 overflow-hidden -z-10" aria-hidden>
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{
          backgroundImage: resolved ? `url("${resolved}")` : undefined,
          opacity: resolved ? 1 : 0,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(13,12,10,0.05) 0%, rgba(13,12,10,0.35) 70%, rgba(13,12,10,0.7) 100%)",
        }}
      />
      <div className="shimmer-overlay" />
      <div className="grain-overlay" />
    </div>
  );
}
