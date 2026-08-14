// ============================================================
// ADMIN DASHBOARD PAGE CONTROLLER
// Loads administrator-only tourism records/messages, renders the dashboard, opens
// the destination/attraction editor and sends create/update/status changes through
// frontend/js/services/admin-service.js.
// ============================================================

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { requireAuthenticatedUser } from "../services/session-guard.js";
import {
  createAdminAttraction,
  createAdminDestination,
  getAdminMessages,
  getAdminPlaces,
  getAdminSummary,
  updateAdminAttraction,
  updateAdminDestination,
  updateAdminMessage
} from "../services/admin-service.js";

// First require a valid account, then enforce the admin role at the page level.
// The backend independently enforces admin authorization on every /api/admin route.
const user = await requireAuthenticatedUser("..");
if (user.role !== "admin") location.replace("./profile.html");
await renderNavbar("..", user);
renderFooter();

// Cache the main dashboard elements and local data arrays used by the render functions.
const summaryEl = document.getElementById("admin-summary");
const destinationList = document.getElementById("admin-destinations-list");
const attractionList = document.getElementById("admin-attractions-list");
const messageList = document.getElementById("admin-messages-list");
const status = document.getElementById("admin-status");
const dialog = document.getElementById("admin-editor");
const form = document.getElementById("admin-editor-form");
let destinations = [];
let attractions = [];
let messages = [];
let activeTab = "destinations";

// Escape API/database text before inserting it into dashboard HTML templates.
const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

// Load the summary, both tourism record collections and Contact messages in parallel.
async function load() {
  status.textContent = "Loading…";
  try {
    const [summary, destinationRows, attractionRows, messageRows] = await Promise.all([
      getAdminSummary(),
      getAdminPlaces("destination"),
      getAdminPlaces("attraction"),
      getAdminMessages()
    ]);

    destinations = destinationRows;
    attractions = attractionRows;
    messages = messageRows;

    // Turn the summary object into small dashboard metric blocks.
    summaryEl.innerHTML = Object.entries(summary)
      .map(([key, value]) => `<div><strong>${value}</strong><span>${escapeHtml(key.replaceAll("_", " "))}</span></div>`)
      .join("");

    render();
    status.textContent = "";
  } catch (error) {
    status.textContent = error.message;
    status.className = "form-message form-message-error";
  }
}

// Shared compact record markup for both destination and attraction admin lists.
function recordCard(place, type) {
  return `<article class="admin-record">
    <div>
      <span class="tag">${escapeHtml(place.category)}</span>
      <h3>${escapeHtml(place.name)}</h3>
      <p>${escapeHtml(place.region)} · ${escapeHtml(place.district || "District not set")}</p>
    </div>
    <div class="admin-record-actions">
      <span class="admin-visibility ${place.isActive ? "is-active" : ""}">${place.isActive ? "Visible" : "Hidden"}</span>
      <button class="secondary-button" type="button" data-edit-type="${type}" data-edit-id="${place.id}">Edit</button>
    </div>
  </article>`;
}

// Render all three dashboard panels from the current in-memory API results.
function render() {
  destinationList.innerHTML = destinations.map((place) => recordCard(place, "destination")).join("");
  attractionList.innerHTML = attractions.map((place) => recordCard(place, "attraction")).join("");

  messageList.innerHTML = messages.length
    ? messages.map((message) => `<article class="admin-message">
        <header>
          <div>
            <strong>${escapeHtml(message.subject)}</strong>
            <span>${escapeHtml(message.name)} · ${escapeHtml(message.email)}</span>
          </div>
          <select data-message-status="${message.id}">
            <option value="new" ${message.status === "new" ? "selected" : ""}>New</option>
            <option value="read" ${message.status === "read" ? "selected" : ""}>Read</option>
            <option value="closed" ${message.status === "closed" ? "selected" : ""}>Closed</option>
          </select>
        </header>
        <p>${escapeHtml(message.message)}</p>
        <small>${new Date(message.createdAt).toLocaleString()}</small>
      </article>`).join("")
    : `<div class="empty-state"><h3>No contact messages yet.</h3></div>`;
}

// Fill the shared modal editor either with an existing place or blank defaults for a new one.
function openEditor(type, place = {}) {
  document.getElementById("admin-editor-type").value = type;
  document.getElementById("admin-editor-id").value = place.id || "";
  document.getElementById("admin-editor-title").textContent = place.id ? `Edit ${place.name}` : `New ${type}`;
  document.getElementById("admin-editor-name").value = place.name || "";
  document.getElementById("admin-editor-category").value = place.category || "";
  document.getElementById("admin-editor-region").value = place.region || "";
  document.getElementById("admin-editor-district").value = place.district || "";
  document.getElementById("admin-editor-parent").value = place.destinationId || "";
  document.getElementById("admin-editor-description").value = place.description || "";
  document.getElementById("admin-editor-highlight").value = place.highlight || "";
  document.getElementById("admin-editor-latitude").value = place.latitude ?? "";
  document.getElementById("admin-editor-longitude").value = place.longitude ?? "";
  document.getElementById("admin-editor-image").value = place.imageUrl || "";
  document.getElementById("admin-editor-active").checked = place.isActive !== false;
  dialog.showModal();
}

// One delegated click listener handles dashboard tab switches and Edit buttons.
document.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-admin-tab]");
  if (tab) {
    activeTab = tab.dataset.adminTab;
    document.querySelectorAll("[data-admin-tab]").forEach((button) => button.classList.toggle("is-active", button === tab));
    document.getElementById("admin-destinations-panel").hidden = activeTab !== "destinations";
    document.getElementById("admin-attractions-panel").hidden = activeTab !== "attractions";
    document.getElementById("admin-messages-panel").hidden = activeTab !== "messages";
  }

  const edit = event.target.closest("[data-edit-id]");
  if (edit) {
    const type = edit.dataset.editType;
    const id = Number(edit.dataset.editId);
    const collection = type === "destination" ? destinations : attractions;
    openEditor(type, collection.find((place) => place.id === id));
  }
});

// Simple toolbar/modal button bindings.
document.getElementById("admin-new-destination").onclick = () => openEditor("destination");
document.getElementById("admin-new-attraction").onclick = () => openEditor("attraction");
document.getElementById("admin-editor-close").onclick = () => dialog.close();
document.getElementById("admin-refresh").onclick = load;

// The same form creates or updates both record types. Presence of an id determines
// POST (new record) versus PATCH (existing record).
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const type = document.getElementById("admin-editor-type").value;
  const id = Number(document.getElementById("admin-editor-id").value || 0);
  const data = {
    name: document.getElementById("admin-editor-name").value,
    category: document.getElementById("admin-editor-category").value,
    region: document.getElementById("admin-editor-region").value,
    district: document.getElementById("admin-editor-district").value || null,
    description: document.getElementById("admin-editor-description").value,
    highlight: document.getElementById("admin-editor-highlight").value || null,
    latitude: document.getElementById("admin-editor-latitude").value || null,
    longitude: document.getElementById("admin-editor-longitude").value || null,
    imageUrl: document.getElementById("admin-editor-image").value || null,
    isActive: document.getElementById("admin-editor-active").checked
  };

  // Attractions may optionally belong to a parent destination.
  if (type === "attraction") {
    data.destinationId = document.getElementById("admin-editor-parent").value || null;
  }

  try {
    if (type === "destination") {
      if (id) await updateAdminDestination(id, data);
      else await createAdminDestination(data);
    } else {
      if (id) await updateAdminAttraction(id, data);
      else await createAdminAttraction(data);
    }

    dialog.close();
    await load();
  } catch (error) {
    status.textContent = error.message;
    status.className = "form-message form-message-error";
  }
});

// Updating a message's select immediately persists its new workflow status.
messageList.addEventListener("change", async (event) => {
  const select = event.target.closest("[data-message-status]");
  if (!select) return;
  await updateAdminMessage(select.dataset.messageStatus, select.value);
  await load();
});

// Populate the dashboard when the page first opens.
await load();
