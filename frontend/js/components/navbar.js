export function renderNavbar(basePath = ".") {
  const header = document.getElementById("site-header");
  if (!header) return;

  header.innerHTML = `
    <nav class="site-nav">
      <a class="brand" href="${basePath}/index.html">Ugo<span>Tour</span></a>
      <div class="nav-links">
        <a href="${basePath}/index.html">Home</a>
        <a href="${basePath}/pages/destinations.html">Destinations</a>
        <a href="${basePath}/pages/bookings.html">Bookings</a>
        <a href="${basePath}/pages/profile.html">Profile</a>
      </div>
      <a class="secondary-button" href="${basePath}/pages/login.html">Login</a>
    </nav>
  `;
}
