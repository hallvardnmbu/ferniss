import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { processImage } from "./images.js";

const IMAGE = /\.(jpe?g|png|webp|avif|gif|svg)$/i;
const STATUSES = ["tilgjengelig", "reservert", "solgt", "på bestilling", "ikke til salgs"];
const KNOWN_FIELDS = ["tittel", "pris", "status", "fremhevet", "meny"];

// "02-Høy flaske" -> "hoy-flaske"
const slugify = (name) =>
  name.replace(/^\d+[-_ ]+/, "").toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Folders starting with "_" or "." are hidden; the rest sort by name, numbers first.
const list = (dir) => {
  try {
    return readdirSync(dir).filter((n) => !/^[._]/.test(n)).sort((a, b) => a.localeCompare(b, "nb", { numeric: true }));
  } catch {
    return [];
  }
};

// A folder holds one .txt file ("Felt: verdi" lines, then ---, then Markdown), images and subfolders.
async function readFolder(dir, mediaPath, out) {
  const names = list(dir);
  const txt = names.find((n) => n.endsWith(".txt"));
  const [head = "", ...body] = txt ? readFileSync(join(dir, txt), "utf8").split(/^---\s*$/m) : [];
  const fields = head.split("\n").map((line) => line.match(/^\s*([^:]+?)\s*:\s*(.+?)\s*$/)).filter(Boolean).map((m) => [m[1], m[2]]);
  const get = (key) => fields.find(([k]) => k.toLowerCase() === key)?.[1];

  for (const n of names.filter((n) => /\.hei[cf]$/i.test(n))) {
    console.warn(`⚠ ${join(dir, n)}: HEIC-bilder kan ikke vises på nett. Lagre bildet som JPG.`);
  }
  const images = mediaPath ? names.filter((n) => IMAGE.test(n)).map((n, i) => processImage(join(dir, n), `${mediaPath}/${i + 1}`, out)) : [];

  return {
    get,
    title: get("tittel") ?? basename(dir).replace(/^\d+[-_ ]+/, ""),
    details: fields.filter(([k]) => !KNOWN_FIELDS.includes(k.toLowerCase())),
    text: Bun.markdown.html(body.join("---").trim()),
    images: await Promise.all(images),
    folders: names.filter((n) => statSync(join(dir, n)).isDirectory()),
  };
}

export async function loadContent(root, out) {
  const settings = await readFolder(root);
  const site = {
    name: settings.get("navn") ?? "Ferniss",
    tagline: settings.get("undertittel"),
    location: settings.get("sted"),
    email: settings.get("e-post"),
    phone: settings.get("telefon"),
    instagram: settings.get("instagram")?.replace(/^@/, ""),
    text: settings.text,
  };

  site.collections = await Promise.all(list(join(root, "samlinger")).map(async (name) => {
    const dir = join(root, "samlinger", name);
    const collection = { ...(await readFolder(dir)), slug: slugify(name) };
    collection.pieces = await Promise.all(collection.folders.map(async (folder) => {
      const slug = slugify(folder);
      const piece = await readFolder(join(dir, folder), `verk/${slug}`, out);
      const status = (piece.get("status") ?? "tilgjengelig").toLowerCase();
      if (!STATUSES.includes(status)) console.warn(`⚠ ${join(dir, folder)}: ukjent status «${status}». Bruk: ${STATUSES.join(", ")}.`);
      return { ...piece, slug, status, collection, price: piece.get("pris"), featured: /^ja$/i.test(piece.get("fremhevet") ?? "") };
    }));
    return collection;
  }));
  site.pieces = site.collections.flatMap((c) => c.pieces);

  site.pages = await Promise.all(list(join(root, "sider")).map(async (name) => {
    const slug = slugify(name);
    const page = await readFolder(join(root, "sider", name), `sider/${slug}`, out);
    return { ...page, slug, menu: page.get("meny") ?? page.title };
  }));

  return site;
}
