// Turns the artist's original photos into web-friendly versions.
// With sharp installed: auto-rotate, resize to a few widths, convert to WebP,
// and cache the results in .cache/ so rebuilds stay fast.
// Without it (or for SVG/GIF): the original file is copied as-is.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";

const WIDTHS = [480, 960, 1600, 2400];
const RESIZABLE = /\.(jpe?g|png|webp|avif|tiff?)$/i;

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn("  ⚠ sharp is not installed — images are copied without resizing. Run `bun install` to enable it.");
}

async function pool(items, limit, task) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) await task(items[next++]);
  });
  await Promise.all(workers);
}

// Returns a Map from the image's public path to { src, srcset? }.
export async function processImages(media, outDir, cacheDir) {
  const result = new Map();
  await pool(media, 4, async ({ from, to, width }) => {
    const copy = () => {
      mkdirSync(dirname(join(outDir, to)), { recursive: true });
      copyFileSync(from, join(outDir, to));
      result.set(to, { src: to });
    };
    if (!sharp || !RESIZABLE.test(from)) return copy();

    try {
      // Keyed on the file's contents, so a re-uploaded photo is re-processed and an unchanged one never is.
      const hash = createHash("sha1").update(readFileSync(from)).digest("hex").slice(0, 16);
      const original = width ?? (await sharp(from).metadata()).width;
      const widths = [...new Set([...WIDTHS.filter((w) => w < original), Math.min(original, WIDTHS.at(-1))])];
      const stem = to.replace(/\.[^.]+$/, "");
      const variants = [];
      for (const w of widths) {
        const cached = join(cacheDir, `${hash}-${w}.webp`);
        if (!existsSync(cached)) {
          mkdirSync(cacheDir, { recursive: true });
          await sharp(from).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toFile(cached);
        }
        const target = `${stem}-${w}.webp`;
        mkdirSync(dirname(join(outDir, target)), { recursive: true });
        copyFileSync(cached, join(outDir, target));
        variants.push({ w, target });
      }
      result.set(to, {
        src: variants.find((v) => v.w >= 1600)?.target ?? variants.at(-1).target,
        srcset: variants.map((v) => ({ path: v.target, w: v.w })),
      });
    } catch (error) {
      console.warn(`  ⚠ could not resize ${from} (${error.message}) — using the original.`);
      copy();
    }
  });
  return result;
}
