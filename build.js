// content/ → dist/. Run with `bun run build`.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadContent } from "./lib/content.js";
import * as pages from "./lib/pages.js";

const out = join(import.meta.dir, "dist");
rmSync(out, { recursive: true, force: true });

const site = await loadContent(join(import.meta.dir, "content"), out);
const files = {
  "index.html": pages.home(site),
  "verk/index.html": pages.works(site),
  "kontakt/index.html": pages.contact(site),
  "404.html": pages.notFound(site),
};
for (const p of site.pieces) files[`verk/${p.slug}/index.html`] = pages.piece(site, p);
for (const p of site.pages) files[`${p.slug}/index.html`] = pages.page(site, p);

for (const [path, html] of Object.entries(files)) {
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), html);
}
cpSync(join(import.meta.dir, "assets"), join(out, "assets"), { recursive: true });
console.log(`✓ ${Object.keys(files).length} sider bygget`);
