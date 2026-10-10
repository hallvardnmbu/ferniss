// Every page on the site. `html` joins arrays and drops empty values, so templates stay readable.
const html = (strings, ...values) =>
  strings.reduce((out, s, i) => out + s + (i < values.length ? [values[i]].flat().filter((v) => v || v === 0).join("") : ""), "");
const attr = (s = "") => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");

const img = (image, alt, sizes = "(max-width: 600px) 100vw, 25vw", eager = false) =>
  image &&
  html`<img src="${image.src}" ${image.srcset && `srcset="${image.srcset}" sizes="${sizes}"`} width="${image.width}" height="${image.height}" alt="${attr(alt)}" ${!eager && 'loading="lazy"'}>`;

const mailto = (site, subject, body = "") =>
  `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

const isForSale = (piece) => piece.status === "tilgjengelig" || piece.status === "reservert";

function layout(site, title, body) {
  return html`<!doctype html>
<html lang="nb">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title && `${title} – `}${site.name}</title>
  ${site.tagline && `<meta name="description" content="${attr(site.tagline)}">`}
  <link rel="icon" href="/assets/favicon.svg">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..600;1,400&display=swap">
  <link rel="stylesheet" href="/assets/style.css">
  <script src="/assets/shelf.js" defer></script>
</head>
<body>
  <header>
    <a class="name" href="/">${site.name}</a>
    <nav>
      <a href="/verk/">Verk</a>
      ${site.pages.map((p) => `<a href="/${p.slug}/">${p.menu}</a>`)}
      <a href="/kontakt/">Kontakt</a>
      <a href="/kontakt/#hylla" class="shelf-link" hidden>Hylla (<span class="shelf-count">0</span>)</a>
    </nav>
  </header>
  <main>
${body}
  </main>
  <footer>
    ${site.name}${site.location && ` · ${site.location}`}
    ${site.email && ` · <a href="mailto:${site.email}">${site.email}</a>`}
    ${site.instagram && ` · <a href="https://instagram.com/${site.instagram}">Instagram</a>`}
  </footer>
</body>
</html>
`;
}

const card = (piece) => html`
<a class="card" href="/verk/${piece.slug}/">
  ${img(piece.images[0], piece.title)}
  <span>${piece.title}${piece.status === "solgt" && ' <i class="dot" title="Solgt"></i>'}</span>
  <span class="muted">${piece.status === "tilgjengelig" && piece.price ? piece.price : piece.status}</span>
</a>`;

export function home(site) {
  const featured = site.pieces.filter((p) => p.featured);
  return layout(site, "", html`
<div class="intro">${site.text}</div>
<div class="grid">${(featured.length ? featured : site.pieces).map(card)}</div>
<p class="more"><a href="/verk/">Alle verk</a></p>`);
}

export function works(site) {
  return layout(site, "Verk", site.collections.map((c) => html`
<section class="collection" id="${c.slug}">
  <h2>${c.title}</h2>
  <div class="lede">${c.text}</div>
  <div class="grid">${c.pieces.map(card)}</div>
</section>`));
}

export function piece(site, p) {
  const subject = `${isForSale(p) ? "Forespørsel" : "Spørsmål"}: ${p.title}`;
  return layout(site, p.title, html`
<article class="split">
  <div class="images">${p.images.map((image, i) => img(image, p.title, "(max-width: 760px) 100vw, 60vw", i === 0))}</div>
  <div class="sticky">
    <p class="muted"><a href="/verk/#${p.collection.slug}">${p.collection.title}</a></p>
    <h1>${p.title}</h1>
    <p>${p.status === "solgt" && '<i class="dot"></i> '}${p.status[0].toUpperCase() + p.status.slice(1)}${isForSale(p) && p.price && ` · ${p.price}`}</p>
    ${p.text}
    ${p.details.length > 0 && html`<dl>${p.details.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`)}</dl>`}
    <p>
      <a class="button" href="${mailto(site, subject, `Hei!\n\nJeg er interessert i «${p.title}».\n`)}">${isForSale(p) ? "Spør om dette verket" : "Spør om et lignende"}</a>
      ${isForSale(p) && `<button class="button quiet shelf-add" data-url="/verk/${p.slug}/" data-title="${attr(p.title)}" data-price="${attr(p.price)}" hidden>Legg på hylla</button>`}
    </p>
  </div>
</article>`);
}

export function page(site, p) {
  return layout(site, p.title, html`
<article class="split">
  <div class="text"><h1>${p.title}</h1>${p.text}</div>
  <div class="images">${p.images.map((image) => img(image, p.title, "(max-width: 760px) 100vw, 40vw"))}</div>
</article>`);
}

export function contact(site) {
  return layout(site, "Kontakt", html`
<article class="text">
  <h1>Kontakt</h1>
  <p>Spørsmål om et verk, bestillinger eller besøk i verkstedet: send en e-post.</p>
  <p>
    <a href="mailto:${site.email}">${site.email}</a>
    ${site.phone && `<br>${site.phone}`}
    ${site.instagram && `<br><a href="https://instagram.com/${site.instagram}">@${site.instagram}</a>`}
  </p>
  <section id="hylla" hidden>
    <h2>Hylla</h2>
    <p class="muted">Verkene du har lagt til side. Send én forespørsel om alle.</p>
    <ul class="shelf-list"></ul>
    <a class="button shelf-send" data-email="${site.email}" href="mailto:${site.email}">Send forespørsel</a>
  </section>
</article>`);
}

export function notFound(site) {
  return layout(site, "Fant ikke siden", `<article class="text"><h1>Fant ikke siden</h1><p><a href="/">Til forsiden</a></p></article>`);
}
