// One function per kind of page. Each returns { path, html }.
import { esc } from "../lib/util.js";
import { layout } from "./layout.js";
import { img, pieceCard, pieceGrid, statusDot, inquiryForm, detailsList, contactBand } from "./components.js";

const page = (ctx, path, options) => ({ path, html: layout(ctx, { path, ...options }) });

export function homePage(ctx) {
  const { site, t, pieces, collections, pages, url } = ctx;
  const featured = (pieces.some((p) => p.featured) ? pieces.filter((p) => p.featured) : pieces.filter((p) => p.status !== "sold")).slice(0, 6);
  const heroPiece = !site.hero ? featured[0] ?? pieces[0] : null;
  const heroImage = site.hero ?? heroPiece?.images[0];
  const teaser = pages.find((p) => p.featured);

  const body = `
<section class="hero">
  <div class="hero-text">
    ${site.location ? `<p class="eyebrow">${esc(site.location)}</p>` : ""}
    <h1 class="hero-name">${esc(site.name)}</h1>
    ${site.tagline ? `<p class="hero-tagline">${esc(site.tagline)}</p>` : ""}
    <div class="prose hero-intro">${site.intro}</div>
    <div class="hero-actions">
      <a class="button" href="${url("works/")}">${esc(t.seeWorks)}</a>
      <a class="link-arrow" href="${url("contact/")}">${esc(t.getInTouch)}</a>
    </div>
  </div>
  <figure class="hero-figure">
    <div class="arch">${img(ctx, heroImage, { eager: true, alt: heroPiece?.title ?? site.name, sizes: "(max-width: 860px) 100vw, 520px" })}</div>
    ${heroPiece ? `<figcaption><a href="${url(`works/${heroPiece.slug}/`)}">${esc(heroPiece.title)}</a></figcaption>` : ""}
    <svg class="hero-ring" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="ring" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0"/></defs><text><textPath href="#ring">${esc(`${site.name} · ${site.tagline || t.works} · `.repeat(2))}</textPath></text></svg>
  </figure>
</section>

${featured.length ? `<section class="section">
  <header class="section-head">
    <h2>${esc(t.featured)}</h2>
    <p>${esc(t.featuredLead)}</p>
    <a class="link-arrow" href="${url("works/")}">${esc(t.allWorks)}</a>
  </header>
  ${pieceGrid(ctx, featured, { arch: true })}
</section>` : ""}

${collections.length ? `<section class="section">
  <header class="section-head"><h2>${esc(t.collections)}</h2></header>
  <div class="collection-rows">
  ${collections.map((c, i) => `<article class="collection-row">
    <a class="collection-row-media" href="${url(`collections/${c.slug}/`)}">${img(ctx, c.cover, { sizes: "(max-width: 760px) 100vw, 55vw" })}</a>
    <div class="collection-row-text">
      <p class="eyebrow">${String(i + 1).padStart(2, "0")} — ${esc(t.pieces(c.pieces.length))}</p>
      <h3><a href="${url(`collections/${c.slug}/`)}">${esc(c.title)}</a></h3>
      <p>${esc(c.excerpt)}</p>
      <div class="mini-strip">${c.pieces.slice(0, 4).map((p) => `<a href="${url(`works/${p.slug}/`)}" title="${esc(p.title)}">${img(ctx, p.images[0], { sizes: "64px" })}</a>`).join("")}</div>
      <a class="link-arrow" href="${url(`collections/${c.slug}/`)}">${esc(t.viewCollection)}</a>
    </div>
  </article>`).join("\n")}
  </div>
</section>` : ""}

${teaser ? `<section class="section teaser">
  ${teaser.images[0] ? `<div class="teaser-media">${img(ctx, teaser.images[0])}</div>` : ""}
  <div class="teaser-text">
    <h2>${esc(teaser.title)}</h2>
    <p>${esc(teaser.excerpt)}</p>
    <a class="link-arrow" href="${url(`${teaser.slug}/`)}">${esc(t.readMore)}</a>
  </div>
</section>` : ""}

${contactBand(ctx)}`;
  return page(ctx, "", { body, bodyClass: "home" });
}

function filterBar(ctx, { showCollections = true } = {}) {
  const { t, collections } = ctx;
  return `<div class="filters" data-filters>
  ${showCollections && collections.length > 1 ? `<div class="chips" role="group">
    <button class="chip" aria-pressed="true" data-filter-collection="">${esc(t.all)}</button>
    ${collections.map((c) => `<button class="chip" aria-pressed="false" data-filter-collection="${c.slug}">${esc(c.title)}</button>`).join("")}
  </div>` : "<div></div>"}
  <label class="toggle"><input type="checkbox" data-filter-available> <span>${esc(t.onlyAvailable)}</span></label>
  <p class="legend"><span class="dot dot-sold"></span> ${esc(t.legend)}</p>
</div>`;
}

export function worksPage(ctx) {
  const { t, pieces } = ctx;
  const body = `
<section class="page-head">
  <h1>${esc(t.works)}</h1>
  <p class="count">${esc(t.pieces(pieces.length))}</p>
</section>
<section class="section">
  ${filterBar(ctx)}
  <div class="grid" data-filterable>${pieces.map((p) => pieceCard(ctx, p)).join("\n")}</div>
  <p class="empty" hidden>${esc(t.nothingHere)}</p>
</section>`;
  return page(ctx, "works/", { title: t.works, body });
}

export function collectionsPage(ctx) {
  const { t, collections, url } = ctx;
  const body = `
<section class="page-head"><h1>${esc(t.collections)}</h1></section>
<section class="section collection-tiles">
  ${collections.map((c) => `<a class="collection-tile" href="${url(`collections/${c.slug}/`)}">
    <div class="arch">${img(ctx, c.cover)}</div>
    <h2>${esc(c.title)}</h2>
    <p>${esc(t.pieces(c.pieces.length))}</p>
  </a>`).join("\n")}
</section>`;
  return page(ctx, "collections/", { title: t.collections, body });
}

export function collectionPage(ctx, collection) {
  const { t } = ctx;
  const body = `
<section class="page-head page-head-split">
  <div>
    <p class="eyebrow"><a href="${ctx.url("collections/")}">${esc(t.collections)}</a></p>
    <h1>${esc(collection.title)}</h1>
    ${detailsList(collection.details)}
  </div>
  <div class="prose">${collection.description}</div>
</section>
<section class="section">
  ${filterBar(ctx, { showCollections: false })}
  <div class="grid" data-filterable>${collection.pieces.map((p) => pieceCard(ctx, p)).join("\n")}</div>
  <p class="empty" hidden>${esc(t.nothingHere)}</p>
</section>
${contactBand(ctx)}`;
  return page(ctx, `collections/${collection.slug}/`, { title: collection.title, description: collection.excerpt, body, image: collection.cover });
}

export function piecePage(ctx, piece) {
  const { t, url, site } = ctx;
  const collection = ctx.collectionBySlug[piece.collection];
  const siblings = collection.pieces;
  const index = siblings.indexOf(piece);
  const prev = siblings[(index - 1 + siblings.length) % siblings.length];
  const next = siblings[(index + 1) % siblings.length];
  const more = siblings.filter((p) => p !== piece).slice(0, 4);
  const inquireLabel = { sold: t.inquireSimilar, notforsale: t.inquireSimilar, commission: t.inquireCommission }[piece.status] ?? t.inquire;
  const subject = encodeURIComponent(t.subjectOne(piece.title));
  const shelfData = esc(JSON.stringify({ slug: piece.slug, title: piece.title, price: piece.price ?? "", url: url(`works/${piece.slug}/`), image: piece.images[0] ? ctx.src(piece.images[0], 200) : "" }));

  const body = `
<article class="piece" data-piece-page>
  <div class="piece-gallery">
    <button class="piece-main" data-lightbox-open="0" aria-label="${esc(piece.title)}">
      ${img(ctx, piece.images[0], { eager: true, sizes: "(max-width: 900px) 100vw, 60vw" })}
    </button>
    ${piece.images.length > 1 ? `<div class="piece-thumbs">${piece.images.map((image, i) => `<button data-thumb="${i}" data-full="${ctx.src(image)}"${i === 0 ? ' aria-current="true"' : ""} aria-label="${esc(t.photo)} ${i + 1}">${img(ctx, image, { alt: "", sizes: "80px" })}</button>`).join("")}</div>` : ""}
  </div>

  <aside class="piece-label">
    <p class="eyebrow"><a href="${url(`collections/${collection.slug}/`)}">${esc(collection.title)}</a></p>
    <h1>${esc(piece.title)}</h1>
    <div class="piece-meta">
      ${statusDot(ctx, piece.status)}
      ${piece.price && piece.status !== "sold" && piece.status !== "notforsale" ? `<span class="price">${esc(piece.price)}</span>` : ""}
    </div>
    <div class="prose">${piece.description}</div>
    ${detailsList(piece.details)}
    <div class="piece-actions">
      <a class="button" href="mailto:${esc(site.email)}?subject=${subject}" data-inquire>${esc(inquireLabel)}</a>
      ${piece.status === "available" || piece.status === "reserved" ? `<button class="button button-ghost" data-shelf-add='${shelfData}' hidden>${esc(t.addToShelf)}</button>` : ""}
    </div>
    <div class="piece-inquiry" hidden>${inquiryForm(ctx, { pieces: [piece] })}</div>
  </aside>
</article>

<nav class="piece-nav">
  <a href="${url(`works/${prev.slug}/`)}" rel="prev">← ${esc(prev.title)}</a>
  <a href="${url(`works/${next.slug}/`)}" rel="next">${esc(next.title)} →</a>
</nav>

${more.length ? `<section class="section">
  <header class="section-head"><h2>${esc(t.moreFrom(collection.title))}</h2></header>
  ${pieceGrid(ctx, more)}
</section>` : ""}

<dialog class="lightbox" data-images='${esc(JSON.stringify(piece.images.map((image) => ctx.src(image, 2400))))}'>
  <img alt="${esc(piece.title)}">
  <button class="lightbox-prev" aria-label="${esc(t.previous)}">←</button>
  <button class="lightbox-next" aria-label="${esc(t.next)}">→</button>
  <button class="lightbox-close" aria-label="${esc(t.close)}">×</button>
</dialog>`;
  return page(ctx, `works/${piece.slug}/`, { title: piece.title, description: piece.excerpt || collection.excerpt, body, image: piece.images[0], bodyClass: "piece-body" });
}

export function contentPage(ctx, p) {
  const body = `
<article class="content-page${p.images.length ? " has-images" : ""}">
  <header class="page-head"><h1>${esc(p.title)}</h1></header>
  <div class="content-grid">
    <div class="prose prose-large">${p.body}</div>
    ${p.images.length ? `<div class="content-images">${p.images.map((image, i) => `<figure${i === 0 ? ' class="arch"' : ""}>${img(ctx, image)}</figure>`).join("")}</div>` : ""}
  </div>
</article>
${contactBand(ctx)}`;
  return page(ctx, `${p.slug}/`, { title: p.title, description: p.excerpt, body, image: p.images[0] });
}

export function contactPage(ctx) {
  const { t, site } = ctx;
  const body = `
<section class="contact">
  <div class="contact-intro">
    <h1>${esc(t.contactTitle)}</h1>
    <p class="lead">${esc(t.contactLead)}</p>
    <ul class="contact-lines">
      ${site.email ? `<li><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></li>` : ""}
      ${site.phone ? `<li><a href="tel:${esc(site.phone.replace(/\s/g, ""))}">${esc(site.phone)}</a></li>` : ""}
      ${site.instagram ? `<li><a href="https://instagram.com/${esc(site.instagram)}" rel="noopener" target="_blank">@${esc(site.instagram)}</a></li>` : ""}
      ${site.location ? `<li>${esc(site.location)}</li>` : ""}
    </ul>
  </div>
  ${inquiryForm(ctx, { useShelf: true })}
</section>`;
  return page(ctx, "contact/", { title: t.contactTitle, body });
}

export function notFoundPage(ctx) {
  const body = `
<section class="not-found">
  <svg viewBox="0 0 120 120" aria-hidden="true"><path d="M30 20h60l-6 18c14 10 20 26 16 44-4 18-20 30-40 30S24 100 20 82c-4-18 2-34 16-44z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M52 40l8 18-10 12 14 20-4 22" fill="none" stroke="currentColor" stroke-width="2"/></svg>
  <h1>404</h1>
  <p>${esc(ctx.t.notFound)}</p>
  <a class="button" href="${ctx.url("")}">${esc(ctx.t.backHome)}</a>
</section>`;
  return page(ctx, "404.html", { title: "404", body });
}
