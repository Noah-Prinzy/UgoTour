/* Phase 1.10 — persistent, accessible show/hide password controls.
   The toggle remains interactive before, during and after password entry. */
const eyeOpen = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>`;

const eyeClosed = `
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M3 3l18 18" />
    <path d="M10.6 6.2A9.5 9.5 0 0 1 12 6c6.1 0 9.5 6 9.5 6a16.7 16.7 0 0 1-3 3.7" />
    <path d="M6.3 6.3C3.8 8.1 2.5 12 2.5 12s3.4 6 9.5 6c1.4 0 2.7-.3 3.8-.8" />
  </svg>`;

function enhancePasswordInput(input) {
  if (!input || input.dataset.visibilityReady === "true") return;
  input.dataset.visibilityReady = "true";

  const shell = document.createElement("span");
  shell.className = "password-field-shell";
  input.parentNode.insertBefore(shell, input);
  shell.appendChild(input);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "password-visibility-toggle";
  toggle.setAttribute("aria-label", "Show password");
  toggle.setAttribute("aria-pressed", "false");
  toggle.title = "Show password";
  toggle.innerHTML = eyeOpen;
  shell.appendChild(toggle);

  // Keep the control independent from the wrapping <label>. Without this,
  // some browsers/password managers can hand the pointer back to the input
  // after it contains text, making the eye feel unavailable.
  toggle.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const showing = input.type === "text";
    input.type = showing ? "password" : "text";

    const nextLabel = showing ? "Show password" : "Hide password";
    toggle.setAttribute("aria-label", nextLabel);
    toggle.setAttribute("aria-pressed", String(!showing));
    toggle.title = nextLabel;
    toggle.innerHTML = showing ? eyeOpen : eyeClosed;

    input.focus({ preventScroll: true });
    try {
      const position = input.value.length;
      input.setSelectionRange(position, position);
    } catch {
      /* Some browsers/input states do not expose a selection range. */
    }
  });
}

document.querySelectorAll('input[type="password"]').forEach(enhancePasswordInput);
