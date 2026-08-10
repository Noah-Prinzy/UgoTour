export function createDestinationCard(destination) {
  const article = document.createElement("article");
  article.className = "experience-card";

  article.innerHTML = `
    <span class="tag">${destination.category}</span>
    <h3>${destination.name}</h3>
    <p>${destination.description}</p>
  `;

  return article;
}
