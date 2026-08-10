// ============================================================
// PHASE 8.5 SHARED UI MOTION SYSTEM
// ============================================================
// The supplied travel-website video uses staged entrance motion, lifted cards,
// restrained parallax-like movement and smooth continuity between states.
// This helper translates that motion language across UgoTour without a UI
// framework and respects prefers-reduced-motion.

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealSelectors = [
  ".page-visual-hero-copy > *",
  ".hero-metric",
  ".hero-feature-pills > *",
  ".profile-hero-identity",
  ".catalog-hero > *",
  ".catalog-controls",
  ".catalog-heading-row",
  ".destination-card",
  ".details-visual-copy > *",
  ".details-gallery-thumb",
  ".details-content-grid > *",
  ".details-info-card",
  ".booking-card",
  ".bookings-hero > *",
  ".auth-intro-panel > *",
  ".auth-form-panel > *",
  ".profile-hero > *",
  ".profile-summary-card",
  ".profile-settings-card",
  ".empty-state"
].join(",");

const prepared = new WeakSet();
let revealIndex = 0;

const observer = !reduceMotion && "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-ui-visible");
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -5% 0px"
    })
  : null;

function prepareElement(element) {
  if (!(element instanceof Element) || prepared.has(element)) return;
  prepared.add(element);

  const delay = Math.min(revealIndex % 6, 5) * 55;
  revealIndex += 1;
  element.style.setProperty("--ui-reveal-delay", `${delay}ms`);
  element.classList.add("ui-reveal");

  if (reduceMotion || !observer) element.classList.add("is-ui-visible");
  else observer.observe(element);
}

function scan(root = document) {
  if (root instanceof Element && root.matches(revealSelectors)) prepareElement(root);
  root.querySelectorAll?.(revealSelectors).forEach(prepareElement);
}

// Content is hidden only after JavaScript is confirmed active. If JavaScript is
// unavailable, the CSS leaves all content visible.
document.documentElement.classList.add("ui-motion-enabled");
scan(document);

// Cards are rendered after fetch() requests. Observe new DOM nodes so they get
// the same staged entrance motion without every page duplicating animation code.
const mutationObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    mutation.addedNodes.forEach((node) => {
      if (node instanceof Element) scan(node);
    });
  }
});

if (document.body) mutationObserver.observe(document.body, { childList: true, subtree: true });
