// ============================================================
// REUSABLE DESTINATION CARD COMPONENT
// ============================================================
// This function creates a card using vanilla JavaScript DOM methods.
// The optional showDetailsButton setting lets the Destinations page
// add a Details button without forcing that button onto every page.

export function createDestinationCard(
  destination,
  { showDetailsButton = false } = {}
) {
  const article = document.createElement("article");
  article.className = "experience-card destination-card";
  article.dataset.destinationId = destination.id;

  // A small region label is shown only when region data exists.
  const regionMarkup = destination.region
    ? `<p class="destination-region">${destination.region}</p>`
    : "";

  // The action button is optional because this component is reused
  // by both the Home page and the full Destinations catalog.
  const actionMarkup = showDetailsButton
    ? `
      <button
        class="destination-details-button"
        type="button"
        data-view-destination="${destination.id}"
      >
        View details
      </button>
    `
    : "";

  article.innerHTML = `
    <div class="destination-card-topline">
      <span class="tag">${destination.category}</span>
      ${regionMarkup}
    </div>

    <h3>${destination.name}</h3>
    <p>${destination.description}</p>

    ${actionMarkup}
  `;

  return article;
}
