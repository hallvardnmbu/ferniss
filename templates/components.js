// Small building blocks reused across pages.
import { esc } from "../lib/util.js";

const CARD_SIZES = "(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 25vw";

// src + srcset/sizes when resized versions exist (see lib/images.js).
export function imageAttributes(ctx, image, sizes = CARD_SIZES) {
  const processed = ctx.images.get(image.path);
  const srcset = processed?.srcset?.length > 1 ? ` srcset="${processed.srcset.map((v) => `${ctx.url(v.path)} ${v.w}w`).join(", ")}" sizes="${sizes}"` : "";
  return `src="${ctx.src(image)}"${srcset}`;
}

export function img(ctx, image, { className = "", sizes, eager = false, alt } = {}) {
  if (!image) return `<div class="img-missing ${className}" aria-hidden="true"></div>`;
  const size = image.width ? ` width="${image.width}" height="${image.height}"` : "";
  return `<img ${imageAttributes(ctx, image, sizes)} alt="${esc(alt ?? image.alt ?? "")}"${size} class="${className}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

// Gallery convention: a red dot next to a work means it has been sold.
export const statusDot = (ctx, status) =>
  `<span class="status status-${status}"><i aria-hidden="true"></i>${esc(ctx.t.status[status])}</span>`;

export function pieceCard(ctx, piece, { arch = false } = {}) {
  const [first, second] = piece.images;
  const collection = ctx.collectionBySlug[piece.collection];
  return `<article class="card${arch ? " card-arch" : ""}" data-collection="${piece.collection}" data-status="${piece.status}">
  <a href="${ctx.url(`verk/${piece.slug}/`)}">
    <div class="card-media${second ? " has-alt" : ""}">
      ${img(ctx, first)}
      ${second ? img(ctx, second, { className: "card-alt", alt: "" }) : ""}
      ${piece.status === "sold" || piece.status === "reserved" ? `<span class="dot dot-${piece.status}" title="${esc(ctx.t.status[piece.status])}"></span>` : ""}
    </div>
    <div class="card-text">
      <h3>${esc(piece.title)}</h3>
      <p>${esc(collection?.title ?? "")}${piece.price && piece.status === "available" ? ` · ${esc(piece.price)}` : piece.status !== "available" ? ` · ${esc(ctx.t.status[piece.status])}` : ""}</p>
    </div>
  </a>
</article>`;
}

export const pieceGrid = (ctx, pieces, options) =>
  `<div class="grid">${pieces.map((piece) => pieceCard(ctx, piece, options)).join("\n")}</div>`;

// The inquiry form. Without a "Skjema" address in innstillinger.txt it composes an email;
// with one (e.g. Formspree) it posts the message directly.
export function inquiryForm(ctx, { pieces = [], useShelf = false, id = "inquiry" } = {}) {
  const { t, site } = ctx;
  return `<form class="inquiry" id="${id}" data-inquiry${useShelf ? " data-use-shelf" : ""} action="${esc(site.formEndpoint ?? `mailto:${site.email}`)}" method="post">
  <div class="inquiry-pieces"${pieces.length || useShelf ? "" : " hidden"}>
    <p class="eyebrow">${esc(t.inquiryAbout)}</p>
    <ul>${pieces.map((piece) => `<li data-piece="${esc(piece.slug)}" data-title="${esc(piece.title)}" data-url="${esc(ctx.url(`verk/${piece.slug}/`))}" data-price="${esc(piece.price ?? "")}">${esc(piece.title)}${piece.price ? ` <span>${esc(piece.price)}</span>` : ""}</li>`).join("")}</ul>
  </div>
  <label><span>${esc(t.yourName)}</span><input name="name" autocomplete="name" required></label>
  <label><span>${esc(t.yourEmail)}</span><input name="email" type="email" autocomplete="email" required></label>
  <label class="wide"><span>${esc(t.yourMessage)}</span><textarea name="message" rows="5" placeholder="${esc(t.messagePlaceholder)}" required></textarea></label>
  <input type="text" name="_gotcha" class="honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">
  <div class="inquiry-actions wide">
    <button class="button" type="submit">${esc(t.send)}</button>
    <p class="inquiry-note">${site.formEndpoint ? `${esc(t.orEmail)} <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : esc(t.mailtoNote)}</p>
  </div>
  <p class="inquiry-status wide" role="status" aria-live="polite"></p>
</form>`;
}

export function detailsList(details) {
  if (!details.length) return "";
  return `<dl class="details">${details.map(({ label, value }) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>`;
}

export function contactBand(ctx) {
  const { t } = ctx;
  return `<section class="band">
  <div class="band-inner">
    <h2>${esc(t.ctaTitle)}</h2>
    <p>${esc(t.ctaText)}</p>
    <a class="button button-light" href="${ctx.url("kontakt/")}">${esc(t.getInTouch)}</a>
  </div>
</section>`;
}
