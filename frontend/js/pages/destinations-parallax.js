// ============================================================
// PHASE 1.16 — DESTINATIONS BACKGROUND PARALLAX
// ============================================================
// Progressive enhancement only. The page remains fully usable without motion.
// We update a CSS custom property from requestAnimationFrame rather than
// mutating layout measurements on every scroll event.

const image = document.getElementById("destinations-parallax-image");
const stage = document.querySelector(".destinations-stage");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let frame = 0;

function renderParallax() {
  frame = 0;
  if (!image || !stage || reduceMotion.matches) {
    document.documentElement.style.setProperty("--destinations-parallax-y", "0px");
    return;
  }

  const rect = stage.getBoundingClientRect();
  const travelled = Math.max(0, -rect.top);
  const maximum = Math.min(window.innerHeight * 0.18, 150);
  const offset = Math.min(travelled * 0.16, maximum);
  document.documentElement.style.setProperty("--destinations-parallax-y", `${offset.toFixed(1)}px`);
}

function queueParallax() {
  if (frame) return;
  frame = requestAnimationFrame(renderParallax);
}

window.addEventListener("scroll", queueParallax, { passive: true });
window.addEventListener("resize", queueParallax, { passive: true });
reduceMotion.addEventListener?.("change", queueParallax);
queueParallax();
