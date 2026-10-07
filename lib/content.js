// Reads the content/ folder and turns it into a plain data model.
// Everything here is forgiving: missing files fall back to sensible defaults
// and problems become friendly warnings instead of crashes.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname, basename, relative } from "node:path";
import { markdown, excerpt, plainText } from "./markdown.js";
import { imageSize } from "./imagesize.js";
import { slugify, fileSlug, prettify, isTruthy, naturalCompare } from "./util.js";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"];
const LARGE_IMAGE_BYTES = 2.5 * 1024 * 1024;

// Norwegian (and a few English) words accepted for each field name.
const FIELD_ALIASES = {
  title: ["title", "tittel"],
  name: ["name", "navn", "artist"],
  tagline: ["tagline", "undertittel", "slagord"],
  price: ["price", "pris"],
  status: ["status"],
  featured: ["featured", "fremhevet", "forside", "front page", "home"],
  hidden: ["hidden", "skjult", "draft", "utkast"],
  order: ["order", "rekkefølge", "sortering"],
  cover: ["cover", "forsidebilde", "omslag"],
  email: ["email", "e-mail", "e-post", "epost", "mail"],
  phone: ["phone", "telefon", "tlf"],
  instagram: ["instagram"],
  location: ["location", "sted", "studio", "verksted"],
  language: ["language", "språk"],
  accent: ["accent", "aksent", "farge", "color", "colour"],
  formEndpoint: ["form endpoint", "form", "skjema"],
  url: ["url", "website", "nettside", "nettadresse", "address"],
  basePath: ["base path", "base"],
  menu: ["menu", "meny", "menu title", "menytittel"],
};

const STATUS_ALIASES = {
  available: ["available", "tilgjengelig", "til salgs", "for sale", "ledig", "ja", "yes"],
  reserved: ["reserved", "reservert", "on hold"],
  sold: ["sold", "solgt"],
  commission: ["commission", "bestilling", "på bestilling", "made to order", "order"],
  notforsale: ["not for sale", "ikke til salgs", "nfs", "privat", "private", "archive", "arkiv"],
};

const aliasLookup = Object.fromEntries(
  Object.entries(FIELD_ALIASES).flatMap(([key, names]) => names.map((name) => [name, key])),
);

export class ContentWarnings extends Array {
  add(file, message) {
    this.push(`${file}: ${message}`);
  }
}

// A text file is a few "Key: value" lines, then the free-text description.
// The two parts are separated by a line of dashes (---) or the first empty line.
export function parseTextFile(raw) {
  const lines = raw.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");
  const fieldPattern = /^\s*([^:\n]{1,40}?)\s*:\s*(.*)$/;
  let head = [];
  let body = lines;

  const divider = lines.findIndex((line) => /^\s*-{3,}\s*$/.test(line));
  if (divider >= 0) {
    head = lines.slice(0, divider);
    body = lines.slice(divider + 1);
  } else {
    const blank = lines.findIndex((line) => line.trim() === "");
    const top = blank >= 0 ? lines.slice(0, blank) : lines;
    if (top.length && top.every((line) => fieldPattern.test(line) && !/^\s*https?:/i.test(line))) {
      head = top;
      body = blank >= 0 ? lines.slice(blank + 1) : [];
    }
  }

  const fields = [];
  for (const line of head) {
    const match = line.match(fieldPattern);
    if (match) fields.push({ label: match[1].trim(), key: aliasLookup[match[1].trim().toLowerCase()], value: match[2].trim() });
  }
  return { fields, body: body.join("\n").trim() };
}

const fieldValue = (fields, key) => fields.find((field) => field.key === key)?.value || undefined;

function normalizeStatus(value, file, warnings) {
  if (!value) return "available";
  const wanted = value.trim().toLowerCase();
  for (const [status, names] of Object.entries(STATUS_ALIASES)) {
    if (names.includes(wanted)) return status;
  }
  warnings.add(file, `unknown status "${value}" — using "available". Try: available, reserved, sold, commission, not for sale.`);
  return "available";
}

const listDir = (dir) => (existsSync(dir) ? readdirSync(dir).filter((name) => !name.startsWith(".")) : []);
const isDir = (path) => statSync(path).isDirectory();
const isImage = (name) => IMAGE_EXTENSIONS.includes(extname(name).toLowerCase());

// Reads a folder: its single .txt file (any name) and its images.
function readFolder(dir, contentRoot, warnings) {
  const entries = listDir(dir);
  const textFiles = entries.filter((name) => name.toLowerCase().endsWith(".txt") || name.toLowerCase().endsWith(".md"));
  const rel = relative(contentRoot, dir) || ".";
  if (textFiles.length > 1) warnings.add(rel, `found several text files, using "${textFiles[0]}".`);
  const textFile = textFiles.sort(naturalCompare)[0];
  const { fields, body } = textFile ? parseTextFile(readFileSync(join(dir, textFile), "utf8")) : { fields: [], body: "" };
  const images = entries.filter((name) => isImage(name) && !isDir(join(dir, name))).sort(naturalCompare);
  const subfolders = entries.filter((name) => isDir(join(dir, name))).sort(naturalCompare);
  return { fields, body, images, subfolders, rel, textFile };
}

export function loadContent(contentRoot, { basePath: basePathOverride } = {}) {
  const warnings = new ContentWarnings();
  const media = []; // { from, to } copy jobs
  const mediaCache = new Map();

  // Registers an image for copying and returns its public info.
  const addImage = (file, publicDir, alt) => {
    if (!mediaCache.has(file)) {
      const ext = extname(file).toLowerCase();
      const buffer = readFileSync(file);
      const name = (fileSlug(basename(file, extname(file))) || "image") + ext;
      const to = `media/${publicDir}/${name}`;
      if (buffer.length > LARGE_IMAGE_BYTES) {
        warnings.add(relative(contentRoot, file), `is ${(buffer.length / 1048576).toFixed(1)} MB — consider exporting it smaller (about 2000 px wide is plenty).`);
      }
      const size = imageSize(buffer, ext) ?? {};
      media.push({ from: file, to, width: size.width });
      mediaCache.set(file, { path: to, ...size });
    }
    return { ...mediaCache.get(file), alt };
  };

  // ---- Site settings ------------------------------------------------------
  const siteFile = join(contentRoot, "site.txt");
  const siteText = existsSync(siteFile) ? parseTextFile(readFileSync(siteFile, "utf8")) : { fields: [], body: "" };
  if (!existsSync(siteFile)) warnings.add("site.txt", "missing — using placeholder settings.");
  const sf = siteText.fields;
  const rootImages = listDir(contentRoot).filter(isImage).sort(naturalCompare);
  const heroFile = rootImages.find((name) => /^(hero|forside|front|cover)/i.test(name)) ?? rootImages[0];

  let basePath = basePathOverride ?? fieldValue(sf, "basePath") ?? "/";
  if (!basePath.startsWith("/")) basePath = "/" + basePath;
  if (!basePath.endsWith("/")) basePath += "/";

  const site = {
    name: fieldValue(sf, "name") ?? fieldValue(sf, "title") ?? "Ferniss",
    tagline: fieldValue(sf, "tagline") ?? "",
    email: fieldValue(sf, "email") ?? "",
    phone: fieldValue(sf, "phone"),
    instagram: fieldValue(sf, "instagram")?.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, ""),
    location: fieldValue(sf, "location") ?? "",
    language: (fieldValue(sf, "language") ?? "nb").toLowerCase().slice(0, 2).replace("no", "nb"),
    accent: fieldValue(sf, "accent"),
    formEndpoint: fieldValue(sf, "formEndpoint"),
    // Just the address (https://example.com); a sub-folder belongs in "Base path".
    url: (() => { try { return new URL(fieldValue(sf, "url")).origin; } catch { return undefined; } })(),
    basePath,
    intro: markdown(siteText.body, undefined, basePath),
    introText: excerpt(siteText.body, 160),
    hero: heroFile ? addImage(join(contentRoot, heroFile), "site", "") : null,
  };
  if (!site.email) warnings.add("site.txt", 'no "Email:" given — visitors will have no way to send inquiries.');
  if (site.accent && !/^#[0-9a-f]{3,8}$|^[a-z]+$|^(rgb|hsl|oklch)\(/i.test(site.accent)) {
    warnings.add("site.txt", `accent colour "${site.accent}" doesn't look like a colour (try something like #a8532e).`);
    site.accent = undefined;
  }

  // ---- Collections and pieces ---------------------------------------------
  const collectionsDir = join(contentRoot, "collections");
  const usedPieceSlugs = new Set();
  const collections = [];

  for (const folder of listDir(collectionsDir).filter((name) => isDir(join(collectionsDir, name)))) {
    if (folder.startsWith("_")) continue;
    const dir = join(collectionsDir, folder);
    const info = readFolder(dir, contentRoot, warnings);
    if (isTruthy(fieldValue(info.fields, "hidden"))) continue;

    const collection = {
      slug: slugify(folder),
      folder,
      title: fieldValue(info.fields, "title") ?? prettify(folder),
      order: Number(fieldValue(info.fields, "order")) || 0,
      details: info.fields.filter((field) => !field.key).map(({ label, value }) => ({ label, value })),
      pieces: [],
    };
    const resolve = (src) => existsSync(join(dir, src)) ? addImage(join(dir, src), `collections/${collection.slug}`, "") : warnings.add(info.rel, `image "${src}" not found.`);
    collection.description = markdown(info.body, resolve, basePath);
    collection.excerpt = excerpt(info.body);
    const coverName = fieldValue(info.fields, "cover");
    if (info.images.length) collection.cover = addImage(join(dir, info.images.includes(coverName) ? coverName : info.images[0]), `collections/${collection.slug}`, collection.title);

    for (const pieceFolder of info.subfolders) {
      if (pieceFolder.startsWith("_")) continue;
      const pieceDir = join(dir, pieceFolder);
      const p = readFolder(pieceDir, contentRoot, warnings);
      if (isTruthy(fieldValue(p.fields, "hidden"))) continue;

      let slug = slugify(pieceFolder);
      if (usedPieceSlugs.has(slug)) slug = `${collection.slug}-${slug}`;
      for (let n = 2; usedPieceSlugs.has(slug); n++) slug = `${slugify(pieceFolder)}-${n}`;
      usedPieceSlugs.add(slug);

      const title = fieldValue(p.fields, "title") ?? prettify(pieceFolder);
      if (!p.textFile) warnings.add(p.rel, "has no text file — showing it with just a title.");
      if (!p.images.length) warnings.add(p.rel, "has no images.");

      const coverName = fieldValue(p.fields, "cover");
      const ordered = coverName && p.images.includes(coverName) ? [coverName, ...p.images.filter((name) => name !== coverName)] : p.images;
      const resolve = (src) => existsSync(join(pieceDir, src)) ? addImage(join(pieceDir, src), `works/${slug}`, title) : warnings.add(p.rel, `image "${src}" not found.`);

      collection.pieces.push({
        slug,
        folder: pieceFolder,
        title,
        collection: collection.slug,
        status: normalizeStatus(fieldValue(p.fields, "status"), p.rel, warnings),
        price: fieldValue(p.fields, "price"),
        featured: isTruthy(fieldValue(p.fields, "featured")),
        order: Number(fieldValue(p.fields, "order")) || 0,
        // Any field we don't know about is shown as a detail: Clay, Glaze, Size …
        details: p.fields.filter((field) => !field.key).map(({ label, value }) => ({ label, value })),
        description: markdown(p.body, resolve, basePath),
        excerpt: excerpt(p.body, 150),
        images: ordered.map((name, i) => addImage(join(pieceDir, name), `works/${slug}`, i === 0 ? title : `${title} (${i + 1})`)),
      });
    }
    collection.pieces.sort((a, b) => a.order - b.order || naturalCompare(a.folder, b.folder));
    collection.cover ??= collection.pieces.find((piece) => piece.images.length)?.images[0];
    if (!collection.pieces.length) warnings.add(info.rel, "has no pieces yet (add a folder per piece).");
    collections.push(collection);
  }
  collections.sort((a, b) => a.order - b.order || naturalCompare(a.folder, b.folder));
  const pieces = collections.flatMap((collection) => collection.pieces);

  // ---- Free-form pages (About, Studio, Exhibitions …) ---------------------
  const pagesDir = join(contentRoot, "pages");
  const reserved = new Set(["works", "collections", "contact", "media", "assets"]);
  const pages = [];
  for (const folder of listDir(pagesDir).filter((name) => isDir(join(pagesDir, name)))) {
    if (folder.startsWith("_")) continue;
    const dir = join(pagesDir, folder);
    const info = readFolder(dir, contentRoot, warnings);
    if (isTruthy(fieldValue(info.fields, "hidden"))) continue;
    let slug = slugify(folder);
    if (reserved.has(slug)) slug = `${slug}-page`;
    const title = fieldValue(info.fields, "title") ?? prettify(folder);
    const used = new Set();
    const resolve = (src) => {
      if (!existsSync(join(dir, src))) return warnings.add(info.rel, `image "${src}" not found.`);
      used.add(src);
      return addImage(join(dir, src), `pages/${slug}`, "");
    };
    const body = markdown(info.body, resolve, basePath);
    pages.push({
      slug,
      folder,
      title,
      menu: fieldValue(info.fields, "menu") ?? title,
      featured: isTruthy(fieldValue(info.fields, "featured")),
      order: Number(fieldValue(info.fields, "order")) || 0,
      body,
      excerpt: excerpt(info.body, 320),
      text: plainText(info.body),
      // Images not placed in the text with ![](…) are shown alongside it.
      images: info.images.filter((name) => !used.has(name)).map((name) => addImage(join(dir, name), `pages/${slug}`, title)),
    });
  }
  pages.sort((a, b) => a.order - b.order || naturalCompare(a.folder, b.folder));

  return { site, collections, pieces, pages, media, warnings };
}
