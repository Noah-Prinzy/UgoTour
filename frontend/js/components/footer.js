export function renderFooter() {
  const footer = document.getElementById("site-footer");
  if (!footer) return;

  const year = new Date().getFullYear();
  footer.className = "site-footer";
  footer.innerHTML = `<p>© ${year} UgoTour. JavaScript-first tourism application starter.</p>`;
}
