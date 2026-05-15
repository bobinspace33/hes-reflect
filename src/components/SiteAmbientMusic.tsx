"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const SRC = encodeURI("/music/5 - Housing.mp3");
const CREDIT_VISIBLE_SEC = 5;

export function SiteAmbientMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [creditVisible, setCreditVisible] = useState(false);

  // Use layout effect so the <audio> ref is wired before autoplay/canplay retries.
  // Avoid `hidden` (display:none) on <audio> — some browsers defer or skip loading media in that state.
  useLayoutEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    el.loop = true;
    el.volume = 0.28;

    let cancelled = false;

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

    const tryPlay = () => {
      if (cancelled) return;
      void el.play().catch(() => {
        /* Usually autoplay policy; pointerdown retry below */
      });
    };

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("play", syncCredit);
    el.addEventListener("pause", syncCredit);
    el.addEventListener("seeked", syncCredit);

    const onCanPlay = () => tryPlay();
    el.addEventListener("canplay", onCanPlay);

    tryPlay();

    const onVis = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("play", syncCredit);
      el.removeEventListener("pause", syncCredit);
      el.removeEventListener("seeked", syncCredit);
      el.removeEventListener("canplay", onCanPlay);
      document.removeEventListener("visibilitychange", onVis);
      el.pause();
    };
  }, []);

  /* First user gesture reliably starts audio when autoplay is blocked */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onGesture = () => {
      void el.play().catch(() => {});
    };
    window.addEventListener("pointerdown", onGesture, { passive: true });
    window.addEventListener("keydown", onGesture, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, []);

  return (
    <>
      <audio
        ref={audioRef}
        src={SRC}
        preload="auto"
        aria-hidden
        playsInline
        className="pointer-events-none fixed left-0 top-0 z-[-1] h-px w-px overflow-hidden opacity-0"
      />
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
