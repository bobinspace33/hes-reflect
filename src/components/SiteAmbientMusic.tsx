"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const SRC = encodeURI("/music/5 - Housing.mp3");

export function SiteAmbientMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevTimeRef = useRef(0);
  const [creditTick, setCreditTick] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    el.loop = true;
    el.volume = 0.28;

    const bumpCredit = () => setCreditTick((n) => n + 1);

    const onTimeUpdate = () => {
      const t = el.currentTime;
      const d = el.duration;
      if (!d || !Number.isFinite(d)) {
        prevTimeRef.current = t;
        return;
      }
      const prev = prevTimeRef.current;
      if (prev > d - 0.65 && t < 1.05) {
        bumpCredit();
      }
      prevTimeRef.current = t;
    };

    el.addEventListener("timeupdate", onTimeUpdate);

    const tryPlay = () => {
      void el
        .play()
        .then(() => {
          bumpCredit();
          prevTimeRef.current = el.currentTime;
        })
        .catch(() => {
          /* Autoplay often blocked until a user gesture — no audio, skip credit pulse */
        });
    };

    tryPlay();

    const onVis = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      document.removeEventListener("visibilitychange", onVis);
      el.pause();
    };
  }, []);

  return (
    <>
      <audio ref={audioRef} src={SRC} preload="auto" aria-hidden className="hidden" />
      <motion.p
        key={creditTick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.45, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none fixed bottom-5 left-5 z-[15] max-w-[min(90vw,16rem)] text-left text-[10px] font-mono leading-snug tracking-wide text-silver-200/85 select-none drop-shadow-[0_1px_8px_rgba(13,12,10,0.65)]"
      >
        🎵 Housing by Optimalystic
      </motion.p>
    </>
  );
}
