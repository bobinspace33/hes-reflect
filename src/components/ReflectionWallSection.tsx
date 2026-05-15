/**
 * Shared explainer for the per-theme reflection thread (slide-over panel).
 */
export function ReflectionWallSection({ variant }: { variant: "intro" | "closing" }) {
  const headingId =
    variant === "intro" ? "introduction-wall-heading" : "closing-wall-heading";
  const copy =
    variant === "intro"
      ? "The wall is the reflection thread that opens when you choose a theme along the bottom of the page. It slides in from the right: scroll through shared notes and add your own (name optional)."
      : "Every theme has the same wall — a scrolling thread beside your reading. Pick any theme below to open the panel, catch up on reflections, and add to the conversation anytime.";

  return (
    <section
      className="mt-6 pt-5 border-t border-white/10"
      aria-labelledby={headingId}
    >
      <h3
        id={headingId}
        className="text-[10px] uppercase tracking-[0.22em] text-silver-300/70 mb-2 font-normal"
      >
        Wall
      </h3>
      <p className="text-silver-200/88 font-mono text-[12.5px] leading-relaxed">{copy}</p>
    </section>
  );
}
