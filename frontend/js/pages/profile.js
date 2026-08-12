import "../ui-motion.js";
import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import {
  getCurrentUserFeedback,
  updateCurrentUserFeedback,
  updateCurrentUserProfileImage
} from "../services/auth-service.js";
import { getBookings } from "../services/booking-service.js";
import { requireAuthenticatedUser } from "../services/session-guard.js";
import { resolveAssetPath } from "../utils/assets.js";

let currentUser = await requireAuthenticatedUser("..");
await renderNavbar("..", currentUser);
renderFooter();

const avatar = document.getElementById("profile-avatar");
const bio = document.getElementById("profile-display-bio");
const visitedList = document.getElementById("profile-visited-list");
const visitedEmpty = document.getElementById("profile-visited-empty");

const photoDialog = document.getElementById("profile-photo-dialog");
const photoDialogClose = document.getElementById("profile-photo-dialog-close");
const photoCancel = document.getElementById("profile-photo-cancel");
const photoChoose = document.getElementById("profile-photo-choose");
const photoInput = document.getElementById("profile-photo-input");
const photoPreview = document.getElementById("profile-photo-preview");
const photoSave = document.getElementById("profile-photo-save");
const photoRemove = document.getElementById("profile-photo-remove");
const cropFrame = document.getElementById("profile-crop-frame");
const cropImage = document.getElementById("profile-crop-image");
const cropZoom = document.getElementById("profile-crop-zoom");

const feedbackDialog = document.getElementById("profile-feedback-dialog");
const feedbackEdit = document.getElementById("profile-feedback-edit");
const feedbackClose = document.getElementById("profile-feedback-close");
const feedbackCancel = document.getElementById("profile-feedback-cancel");
const feedbackSave = document.getElementById("profile-feedback-save");
const feedbackText = document.getElementById("profile-feedback-text");
const ratingPicker = document.getElementById("profile-rating-picker");

let currentFeedback = null;
let pendingProfileImage;
let photoSaveInProgress = false;
let sourceImage = null;
let sourceObjectUrl = null;
let cropState = { zoom: 1, x: 0, y: 0 };
let dragState = null;
let selectedRating = 0;

function renderProfileIdentity() {
  setText("profile-display-name", currentUser.name);
  if (bio) bio.textContent = currentUser.bio?.trim() || "Add a short bio to tell your Uganda travel story.";
  renderAvatar(currentUser.profileImage);
}

function renderAvatar(imageData = null) {
  if (!avatar) return;
  avatar.innerHTML = imageData
    ? `<img src="${imageData}" alt="Profile picture" />`
    : escapeHtml(makeInitials(currentUser?.name));
}

function renderPhotoPreview(imageData = null) {
  if (!photoPreview) return;
  photoPreview.innerHTML = imageData
    ? `<img src="${imageData}" alt="Profile picture preview" />`
    : `<span>${escapeHtml(makeInitials(currentUser?.name))}</span>`;
}

async function loadVisitedPlaces() {
  try {
    const bookings = await getBookings();
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const seen = new Set();
    const visited = bookings
      .filter((booking) => new Date(`${booking.travelDate}T00:00:00`) <= today)
      .sort((a, b) => String(b.travelDate).localeCompare(String(a.travelDate)))
      .filter((booking) => {
        const key = Number(booking.destinationId);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    if (!visitedList || !visitedEmpty) return;
    visitedList.innerHTML = "";
    visitedEmpty.hidden = visited.length !== 0;
    visitedList.hidden = visited.length === 0;

    visited.forEach((booking) => {
      const link = document.createElement("a");
      link.className = "visited-place-card";
      link.href = `./destination-details.html?id=${Number(booking.destinationId)}`;
      const image = resolveAssetPath(booking.destinationImageUrl, "..");
      link.innerHTML = `<img src="${escapeHtml(image)}" alt="${escapeHtml(booking.destinationName)}" loading="lazy"/><span class="visited-place-copy"><strong>${escapeHtml(booking.destinationName)}</strong><span>${escapeHtml(booking.destinationRegion || "Uganda")} · visited ${escapeHtml(formatDate(booking.travelDate))}</span></span>`;
      visitedList.appendChild(link);
    });
  } catch (error) {
    console.error("Could not load visited places:", error);
    if (visitedEmpty) {
      visitedEmpty.hidden = false;
      visitedEmpty.textContent = "Your journey history could not be loaded right now.";
    }
  }
}

async function loadFeedback() {
  try { currentFeedback = await getCurrentUserFeedback(); }
  catch (error) { console.error("Could not load feedback:", error); currentFeedback = null; }
  renderFeedback();
}

function renderFeedback() {
  const stars = document.getElementById("profile-feedback-stars");
  const review = document.getElementById("profile-feedback-review");
  if (!stars || !review) return;
  if (!currentFeedback) {
    stars.textContent = "☆☆☆☆☆";
    stars.setAttribute("aria-label", "No rating yet");
    review.textContent = "You have not reviewed UgoTour yet.";
    review.classList.add("profile-feedback-empty");
    if (feedbackEdit) feedbackEdit.textContent = "Share feedback";
    return;
  }
  stars.textContent = "★".repeat(currentFeedback.rating) + "☆".repeat(5 - currentFeedback.rating);
  stars.setAttribute("aria-label", `${currentFeedback.rating} out of 5 stars`);
  review.textContent = currentFeedback.review;
  review.classList.remove("profile-feedback-empty");
  if (feedbackEdit) feedbackEdit.textContent = "Update feedback";
}

function openFeedbackEditor() {
  selectedRating = currentFeedback?.rating || 0;
  if (feedbackText) feedbackText.value = currentFeedback?.review || "";
  renderRatingPicker();
  clearMessage("profile-feedback-message");
  feedbackDialog?.showModal?.();
}
function closeFeedbackEditor() { if (feedbackDialog?.open) feedbackDialog.close(); }
function renderRatingPicker() {
  ratingPicker?.querySelectorAll("[data-rating]").forEach((button) => {
    const active = Number(button.dataset.rating) <= selectedRating;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(Number(button.dataset.rating) === selectedRating));
  });
}
ratingPicker?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-rating]");
  if (!button) return;
  selectedRating = Number(button.dataset.rating);
  renderRatingPicker();
});
feedbackEdit?.addEventListener("click", openFeedbackEditor);
feedbackClose?.addEventListener("click", closeFeedbackEditor);
feedbackCancel?.addEventListener("click", closeFeedbackEditor);
feedbackSave?.addEventListener("click", async () => {
  const review = feedbackText?.value.trim() || "";
  if (!selectedRating) return showMessage("profile-feedback-message", "Choose a rating from 1 to 5 stars.", false);
  if (!review) return showMessage("profile-feedback-message", "Write a short review before saving.", false);
  feedbackSave.disabled = true;
  const result = await updateCurrentUserFeedback({ rating: selectedRating, review });
  showMessage("profile-feedback-message", result.message, result.success);
  feedbackSave.disabled = false;
  if (result.success) {
    currentFeedback = result.feedback;
    renderFeedback();
    window.setTimeout(closeFeedbackEditor, 450);
  }
});

function resetPhotoEditor() {
  pendingProfileImage = undefined;
  photoSaveInProgress = false;
  sourceImage = null;
  cropState = { zoom: 1, x: 0, y: 0 };
  if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);
  sourceObjectUrl = null;
  if (photoInput) photoInput.value = "";
  if (photoSave) photoSave.disabled = true;
  if (photoRemove) photoRemove.disabled = !currentUser.profileImage;
  if (cropZoom) cropZoom.value = "1";
  photoDialog?.classList.remove("has-crop");
  renderPhotoPreview(currentUser.profileImage);
  clearMessage("profile-photo-message");
}

function openPhotoEditor() {
  resetPhotoEditor();
  if (photoDialog?.showModal) {
    photoDialog.showModal();
    window.setTimeout(() => photoChoose?.focus(), 0);
  } else photoDialog?.setAttribute("open", "");
}
function closePhotoEditor() {
  if (photoSaveInProgress) return;
  if (photoDialog?.open && photoDialog.close) photoDialog.close();
  else photoDialog?.removeAttribute("open");
  resetPhotoEditor();
}

document.getElementById("profile-photo-edit")?.addEventListener("click", openPhotoEditor);
photoChoose?.addEventListener("click", () => photoInput?.click());
photoDialogClose?.addEventListener("click", closePhotoEditor);
photoCancel?.addEventListener("click", closePhotoEditor);

photoInput?.addEventListener("change", async () => {
  const file = photoInput.files?.[0];
  if (!file) return;
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowedTypes.has(file.type)) return showMessage("profile-photo-message", "Choose a JPEG, PNG or WebP image.", false);
  if (file.size > 6_000_000) return showMessage("profile-photo-message", "Choose an image smaller than 6 MB.", false);

  try {
    showNeutralMessage("profile-photo-message", "Preparing crop editor…");
    if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);
    sourceObjectUrl = URL.createObjectURL(file);
    sourceImage = await loadImage(sourceObjectUrl);
    cropState = { zoom: 1, x: 0, y: 0 };
    if (cropZoom) cropZoom.value = "1";
    cropImage.src = sourceObjectUrl;
    photoDialog?.classList.add("has-crop");
    requestAnimationFrame(renderCrop);
    if (photoSave) photoSave.disabled = false;
    if (photoRemove) photoRemove.disabled = false;
    showMessage("profile-photo-message", "Drag and zoom until the crop looks right, then save.", true);
  } catch (error) {
    console.error("Could not prepare profile picture:", error);
    showMessage("profile-photo-message", "That image could not be prepared.", false);
  }
});

function cropGeometry() {
  if (!sourceImage || !cropFrame) return null;
  const size = cropFrame.clientWidth;
  const baseScale = Math.max(size / sourceImage.naturalWidth, size / sourceImage.naturalHeight);
  const scale = baseScale * cropState.zoom;
  const width = sourceImage.naturalWidth * scale;
  const height = sourceImage.naturalHeight * scale;
  return { size, baseScale, scale, width, height };
}
function clampCrop() {
  const g = cropGeometry();
  if (!g) return;
  cropState.x = Math.max(-(g.width - g.size) / 2, Math.min((g.width - g.size) / 2, cropState.x));
  cropState.y = Math.max(-(g.height - g.size) / 2, Math.min((g.height - g.size) / 2, cropState.y));
}
function renderCrop() {
  const g = cropGeometry();
  if (!g || !cropImage) return;
  clampCrop();
  cropImage.style.width = `${g.width}px`;
  cropImage.style.height = `${g.height}px`;
  cropImage.style.transform = `translate(calc(-50% + ${cropState.x}px), calc(-50% + ${cropState.y}px))`;
}

cropZoom?.addEventListener("input", () => {
  cropState.zoom = Number(cropZoom.value) || 1;
  renderCrop();
});
cropFrame?.addEventListener("pointerdown", (event) => {
  if (!sourceImage) return;
  cropFrame.setPointerCapture?.(event.pointerId);
  dragState = { pointerId:event.pointerId, x:event.clientX, y:event.clientY };
});
cropFrame?.addEventListener("pointermove", (event) => {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  cropState.x += event.clientX - dragState.x;
  cropState.y += event.clientY - dragState.y;
  dragState.x = event.clientX; dragState.y = event.clientY;
  renderCrop();
});
function endCropDrag(event) { if (dragState?.pointerId === event.pointerId) dragState = null; }
cropFrame?.addEventListener("pointerup", endCropDrag);
cropFrame?.addEventListener("pointercancel", endCropDrag);
window.addEventListener("resize", () => { if (sourceImage) renderCrop(); });

photoRemove?.addEventListener("click", () => {
  pendingProfileImage = null;
  sourceImage = null;
  photoDialog?.classList.remove("has-crop");
  renderPhotoPreview(null);
  if (photoSave) photoSave.disabled = false;
  photoRemove.disabled = true;
  showNeutralMessage("profile-photo-message", "Your current photo will be removed when you save.");
});

photoSave?.addEventListener("click", async () => {
  if (photoSaveInProgress) return;
  try {
    photoSaveInProgress = true;
    photoSave.disabled = true;
    if (sourceImage) pendingProfileImage = await encodeCurrentCrop();
    if (pendingProfileImage === undefined) return;
    showNeutralMessage("profile-photo-message", "Saving your profile picture…");
    const result = await updateCurrentUserProfileImage(pendingProfileImage);
    showMessage("profile-photo-message", result.message, result.success);
    if (!result.success) return;
    currentUser = result.user;
    renderAvatar(currentUser.profileImage);
    await renderNavbar("..", currentUser);
    window.location.replace("../index.html");
  } catch (error) {
    console.error("Could not save profile picture:", error);
    showMessage("profile-photo-message", "Your profile picture could not be saved. Please try again.", false);
  } finally {
    photoSaveInProgress = false;
    if (photoSave) photoSave.disabled = false;
  }
});

async function encodeCurrentCrop() {
  const g = cropGeometry();
  if (!g || !sourceImage) return undefined;
  const sourceSide = g.size / g.scale;
  const sourceX = (sourceImage.naturalWidth - sourceSide) / 2 - cropState.x / g.scale;
  const sourceY = (sourceImage.naturalHeight - sourceSide) / 2 - cropState.y / g.scale;

  for (const [size, quality] of [[768,.88],[640,.84],[560,.80]]) {
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const context = canvas.getContext("2d", { alpha:false });
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(sourceImage, sourceX, sourceY, sourceSide, sourceSide, 0, 0, size, size);
    const data = canvas.toDataURL("image/jpeg", quality);
    if (data.length <= 820_000) return data;
  }
  throw new Error("Cropped image is still too large");
}

photoDialog?.addEventListener("cancel", (event) => {
  if (photoSaveInProgress) event.preventDefault();
  else resetPhotoEditor();
});
photoDialog?.addEventListener("click", (event) => { if (event.target === photoDialog) closePhotoEditor(); });
photoDialog?.addEventListener("close", () => { if (!photoSaveInProgress) resetPhotoEditor(); });
feedbackDialog?.addEventListener("click", (event) => { if (event.target === feedbackDialog) closeFeedbackEditor(); });

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Invalid image"));
    image.src = src;
  });
}
function showMessage(id, message, success) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${success ? "form-message-success" : "form-message-error"}`;
}
function showNeutralMessage(id, message) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = message;
  element.className = "form-message";
}
function clearMessage(id) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = "";
  element.className = "form-message";
}
function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value ?? ""; }
function makeInitials(name) { return String(name ?? "UG").trim().split(/\s+/).slice(0,2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "UG"; }
function formatDate(value) { return value ? new Intl.DateTimeFormat("en", { day:"numeric", month:"short", year:"numeric" }).format(new Date(`${value}T00:00:00`)) : "Unknown"; }
function escapeHtml(value) { return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }

renderProfileIdentity();
await Promise.all([loadVisitedPlaces(), loadFeedback()]);
