// Phase 1.19 — natural-language nearby commands layered on top of the existing
// map controller. Existing hidden category buttons keep the proven map.js
// discovery logic as the single source of truth; this module only translates
// user phrases into those existing actions.

const input = document.getElementById("map-search-input");
const status = document.getElementById("map-status-toast");
const clearButton = document.getElementById("map-search-clear");
const categoryButtons = new Map(
  [...document.querySelectorAll("[data-nearby-category]")]
    .map((button) => [button.dataset.nearbyCategory, button])
);

let allowNativeSearch = false;

const intents = [
  { category: "hotels", pattern: /\b(hotels?|lodges?|accommodation|places?\s+to\s+stay|stay)\b/i },
  { category: "restaurants", pattern: /\b(restaurants?|food|cafes?|coffee|eat|dining)\b/i },
  { category: "fuel", pattern: /\b(fuel|petrol|gas(?:\s+station)?s?|filling\s+stations?)\b/i },
  { category: "hospitals", pattern: /\b(hospitals?|clinics?|health|medical|pharmacy|pharmacies)\b/i },
  { category: "attractions", pattern: /\b(attractions?|sites?|things?\s+to\s+do|tourist\s+places?|places?\s+to\s+visit)\b/i }
];

function parseIntent(query) {
  const normalized = String(query || "").trim();
  if (!normalized) return null;
  const intent = intents.find((item) => item.pattern.test(normalized));
  if (!intent) return null;

  const nearMe = /\b(?:near|around|close\s+to)\s+me\b/i.test(normalized);
  if (nearMe) return { category: intent.category, nearMe: true, place: "" };

  const locationMatch = normalized.match(/\b(?:near|around|in|close\s+to)\s+(.+?)\s*$/i);
  const place = locationMatch?.[1]?.replace(/[?.!,]+$/g, "").trim() || "";
  return { category: intent.category, nearMe: false, place };
}

function runCategory(category) {
  const button = categoryButtons.get(category);
  if (!button) return false;
  button.click();
  return true;
}

function dispatchNativeAreaSearch(place) {
  if (!input || !place) return;
  input.value = place;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  allowNativeSearch = true;
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
  allowNativeSearch = false;
}

async function waitForAreaSearchThenRun(category) {
  const started = performance.now();
  let sawBusyState = false;
  while (performance.now() - started < 9000) {
    await new Promise((resolve) => setTimeout(resolve, 260));
    const message = String(status?.textContent || "").toLowerCase();
    if (/search|looking|finding|loading/.test(message)) sawBusyState = true;
    const done = sawBusyState && message && !/search|looking|finding|loading/.test(message);
    if (done) {
      runCategory(category);
      return;
    }
  }
  // If the provider gave no transient status, still fall back to the existing
  // nearby action; it will use whichever discovery context map.js has resolved.
  runCategory(category);
}

async function handleIntent(query) {
  const parsed = parseIntent(query);
  if (!parsed) return false;

  if (parsed.nearMe || !parsed.place) {
    runCategory(parsed.category);
    return true;
  }

  dispatchNativeAreaSearch(parsed.place);
  waitForAreaSearchThenRun(parsed.category);
  return true;
}

input?.addEventListener("keydown", async (event) => {
  if (allowNativeSearch || event.key !== "Enter") return;
  const parsed = parseIntent(input.value);
  if (!parsed) return;

  // Capture-phase interception prevents the original map.js Enter handler from
  // simultaneously issuing a generic place search for the whole phrase.
  event.preventDefault();
  event.stopImmediatePropagation();
  closeTransientSuggestions();
  await handleIntent(input.value);
}, { capture: true });

function closeTransientSuggestions() {
  const suggestions = document.getElementById("map-search-suggestions");
  if (suggestions) suggestions.hidden = true;
}

// Keep the clear affordance in sync when a natural-language command is typed.
input?.addEventListener("input", () => {
  if (clearButton) clearButton.hidden = !input.value;
});
