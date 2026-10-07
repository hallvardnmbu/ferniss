// Builds the static site: content/ → dist/
//   bun run build              (or: node build.js)
//   BASE_PATH=/ferniss/ bun run build   when hosting under a sub-folder
import { mkdirSync, rmSync, writeFileSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "./lib/content.js";
import { t } from "./lib/i18n.js";
import { processImages } from "./lib/images.js";
import * as pages from "./templates/pages.js";
import { imageAttributes } from "./templates/components.js";

const root = dirname(fileURLToPath(import.meta.url));
const contentDir = process.env.CONTENT_DIR ?? join(root, "content");
const outDir = process.env.OUT_DIR ?? join(root, "dist");

export async function build() {
  const started = Date.now();
  const content = loadContent(contentDir, { basePath: process.env.BASE_PATH || undefined });
  const { site, collections, pieces, warnings } = content;

  rmSync(outDir, { recursive: true, force: true });
  const images = await processImages(content.media, outDir, join(root, ".cache", "images"));

  const ctx = {
    ...content,
    t,
    url: (path = "") => site.basePath + path.replace(/^\//, ""),
    images,
    // Public URL of the best version of an image, optionally the smallest one at least `width` wide.
    src: (image, width) => {
      const processed = images.get(image.path);
      const pick = width && processed?.srcset?.find((v) => v.w >= width)?.path;
      return ctx.url(pick ?? processed?.src ?? image.path);
    },
    collectionBySlug: Object.fromEntries(collections.map((c) => [c.slug, c])),
    version: started.toString(36),
  };

  const output = [
    pages.homePage(ctx),
    pages.worksPage(ctx),
    pages.contactPage(ctx),
    pages.notFoundPage(ctx),
    ...(collections.length > 1 ? [pages.collectionsPage(ctx)] : []),
    ...collections.map((c) => pages.collectionPage(ctx, c)),
    ...pieces.map((p) => pages.piecePage(ctx, p)),
    ...content.pages.map((p) => pages.contentPage(ctx, p)),
  ];

  for (const { path, html: raw } of output) {
    // Images placed inside text with ![](…) are resolved now that they are processed.
    const html = raw.replace(/<img data-media="([^"]+)"/g, (_, media) => `<img ${imageAttributes(ctx, { path: media }, "(max-width: 760px) 100vw, 640px")}`);
    const file = join(outDir, path.endsWith(".html") ? path : join(path, "index.html"));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
  }
  cpSync(join(root, "assets"), join(outDir, "assets"), { recursive: true });

  if (site.url) {
    const urls = output.filter((o) => !o.path.endsWith(".html")).map((o) => `  <url><loc>${site.url}${ctx.url(o.path)}</loc></url>`);
    writeFileSync(join(outDir, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
    writeFileSync(join(outDir, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${site.url}${ctx.url("sitemap.xml")}\n`);
  }
  writeFileSync(join(outDir, ".nojekyll"), "");

  for (const warning of warnings) console.warn(`  ⚠ ${warning}`);
  console.log(`✓ Bygget ${output.length} sider, ${pieces.length} verk og ${content.media.length} bilder på ${Date.now() - started} ms → ${outDir}`);
  return { ok: true, warnings };
}

if (import.meta.main ?? process.argv[1] === fileURLToPath(import.meta.url)) await build();
