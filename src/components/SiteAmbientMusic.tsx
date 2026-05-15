"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const SRC = encodeURI("/music/5 - Housing.mp3");
const CREDIT_VISIBLE_SEC = 5;

export function SiteAmbientMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [creditVisible, setCreditVisible] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    el.loop = true;
    el.volume = 0.28;

    const syncCredit = () => {
      const d = el.duration;
      const t = el.currentTime;
      const ready = Number.isFinite(d) && d > 0;
      const show = ready && !el.paused && t < CREDIT_VISIBLE_SEC;
      setCreditVisible(show);
    };

    const onTimeUpdate = () => {
      syncCredit();
    };

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("play", syncCredit);
    el.addEventListener("pause", syncCredit);
    el.addEventListener("seeked", syncCredit);

    const tryPlay = () => {
      void el.play().catch(() => {
        /* Autoplay often blocked until a user gesture — no audio, no credit */
      });
    };

    tryPlay();

    const onVis = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("play", syncCredit);
      el.removeEventListener("pause", syncCredit);
      el.removeEventListener("seeked", syncCredit);
      document.removeEventListener("visibilitychange", onVis);
      el.pause();
    };
  }, []);

  return (
    <>
      <audio ref={audioRef} src={SRC} preload="auto" aria-hidden className="hidden" />
      <motion.p
        animate={{ opacity: creditVisible ? 1 : 0 }}
        transition={{
          duration: creditVisible ? 1.45 : 0.55,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="pointer-events-none fixed bottom-5 left-5 z-[15] max-w-[min(90vw,16rem)] text-left text-[10px] font-mono leading-snug tracking-wide text-silver-200/85 select-none drop-shadow-[0_1px_8px_rgba(13,12,10,0.65)]"
      >
        🎵 Housing by Optimalystic
      </motion.p>
    </>
  );
}
