// The frame around every page: <head>, header, navigation, shelf drawer, footer.
import { esc, inlineJson } from "../lib/util.js";
import { clientStrings } from "../lib/i18n.js";

export function layout(ctx, { title, description, body, path = "", image, bodyClass = "" }) {
  const { site, t, url, pages } = ctx;
  const fullTitle = title ? `${title} — ${site.name}` : site.tagline ? `${site.name} — ${site.tagline}` : site.name;
  const canonical = site.url ? site.url + url(path) : null;
  const ogImage = image ?? site.hero;
  const navLink = (href, label, match) =>
    `<a href="${url(href)}"${match ? ' aria-current="page"' : ""}>${esc(label)}</a>`;
  const section = path.split("/")[0];

  return `<!doctype html>
<html lang="${esc(site.language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(description ?? site.introText ?? site.tagline)}">
  <meta property="og:title" content="${esc(title ?? site.name)}">
  <meta property="og:site_name" content="${esc(site.name)}">
  <meta property="og:description" content="${esc(description ?? site.introText ?? site.tagline)}">
  ${canonical ? `<link rel="canonical" href="${esc(canonical)}"><meta property="og:url" content="${esc(canonical)}">` : ""}
  ${ogImage && site.url ? `<meta property="og:image" content="${esc(site.url + ctx.src(ogImage, 1200))}">` : ""}
  <link rel="icon" href="${url("assets/favicon.svg")}" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..700,100,1;1,9..144,300..700,100,1&family=Karla:ital,wght@0,400..700;1,400&display=swap">
  <link rel="stylesheet" href="${url("assets/style.css")}?v=${ctx.version}">
  ${site.accent ? `<style>:root{--accent:${esc(site.accent)}}</style>` : ""}
  <script>window.FERNISS=${inlineJson({ base: site.basePath, email: site.email, endpoint: site.formEndpoint ?? null, t: clientStrings(t) })}</script>
  <script src="${url("assets/site.js")}?v=${ctx.version}" defer></script>
</head>
<body class="${esc(bodyClass)}">
  <a class="skip" href="#main">↓</a>
  <header class="site-header">
    <a class="wordmark" href="${url("")}">${esc(site.name)}</a>
    <button class="menu-toggle" aria-expanded="false" aria-controls="site-nav">${esc(t.menu)}</button>
    <nav id="site-nav" class="site-nav">
      ${navLink("works/", t.works, section === "works")}
      ${ctx.collections.length > 1 ? navLink("collections/", t.collections, section === "collections") : ""}
      ${pages.map((page) => navLink(`${page.slug}/`, page.menu, section === page.slug)).join("")}
      ${navLink("contact/", t.contact, section === "contact")}
      <button class="shelf-toggle" aria-controls="shelf" aria-expanded="false" hidden>
        ${esc(t.shelf)} <span class="shelf-count" aria-live="polite">0</span>
      </button>
    </nav>
  </header>

  <main id="main">
${body}
  </main>

  <aside id="shelf" class="shelf" aria-label="${esc(t.shelfTitle)}" hidden>
    <div class="shelf-panel">
      <header><h2>${esc(t.shelfTitle)}</h2><button class="shelf-close" aria-label="${esc(t.close)}">×</button></header>
      <ul class="shelf-list"></ul>
      <p class="shelf-empty">${esc(t.shelfEmpty)}</p>
      <a class="button shelf-send" href="${url("contact/")}?shelf">${esc(t.shelfSend)}</a>
    </div>
  </aside>

  <footer class="site-footer">
    <div class="footer-name">${esc(site.name)}</div>
    <ul class="footer-links">
      ${site.location ? `<li>${esc(site.location)}</li>` : ""}
      ${site.email ? `<li><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></li>` : ""}
      ${site.phone ? `<li><a href="tel:${esc(site.phone.replace(/\s/g, ""))}">${esc(site.phone)}</a></li>` : ""}
      ${site.instagram ? `<li><a href="https://instagram.com/${esc(site.instagram)}" rel="noopener" target="_blank">Instagram</a></li>` : ""}
    </ul>
    <div class="footer-copy">© ${new Date().getFullYear()}</div>
  </footer>
</body>
</html>
`;
}
