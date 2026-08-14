// ============================================================
// SEO FILE GENERATOR
// Builds production sitemap.xml and robots.txt after the real deployed domain is
// known. Run with PUBLIC_SITE_URL or pass the URL as the first CLI argument.
// ============================================================

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Accept the base domain from hosting environment configuration or the command line.
const rawBase = process.env.PUBLIC_SITE_URL || process.argv[2];
if (!rawBase) {
  console.error("Set PUBLIC_SITE_URL or pass the deployed site URL: node scripts/build-seo.js https://example.com");
  process.exit(1);
}
const base = rawBase.replace(/\/$/, "");

// Only public discovery/editorial pages belong in the sitemap.
const paths = [
  "/index.html", "/pages/destinations.html", "/pages/map.html", "/pages/about.html",
  "/pages/help.html", "/pages/contact.html", "/pages/terms.html"
];
const today = new Date().toISOString().slice(0,10);

// Generate standards-compatible sitemap XML from the public page list.
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((path)=>`  <url><loc>${base}${path}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`;

// robots.txt allows the public site but discourages indexing private/account/admin pages.
const robots = `User-agent: *\nAllow: /\nDisallow: /pages/admin.html\nDisallow: /pages/profile.html\nDisallow: /pages/saved.html\nDisallow: /pages/bookings.html\nDisallow: /pages/login.html\nDisallow: /pages/signup.html\n\nSitemap: ${base}/sitemap.xml\n`;

// Write both generated files directly into the frontend root used in production.
await writeFile(resolve("frontend/sitemap.xml"), sitemap);
await writeFile(resolve("frontend/robots.txt"), robots);
console.log(`SEO files built for ${base}`);
