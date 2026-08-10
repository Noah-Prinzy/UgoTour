// ============================================================
// REUSABLE DESTINATION CARD COMPONENT
// ============================================================
// This function creates a destination card with vanilla JavaScript.
// The optional detailsPagePath lets a page decide whether the card
// should include a link to the reusable destination-details page.

export function createDestinationCard(
  destination,
  { detailsPagePath = null } = {}
) {
  const article = document.createElement("article");
  article.className = "experience-card destination-card";
  article.dataset.destinationId = destination.id;

  const regionMarkup = destination.region
    ? `<p class="destination-region">${destination.region}</p>`
    : "";

  // If a details path is supplied, build a URL such as:
  // ./destination-details.html?id=3
  const actionMarkup = detailsPagePath
    ? `
      <a
        class="destination-details-button"
        href="${detailsPagePath}?id=${destination.id}"
      >
        View full details
      </a>
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
