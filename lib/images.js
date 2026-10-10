import sharp from "sharp";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, extname, join } from "node:path";

const CACHE = join(import.meta.dir, "..", ".cache");

// Resizes a photo to two WebP sizes (cached by file content) and returns what <img> needs.
export async function processImage(file, name, out) {
  const meta = await sharp(file).metadata();
  const { width, height } = meta.autoOrient;
  mkdirSync(dirname(join(out, "media", name)), { recursive: true });

  if (meta.format === "svg" || meta.format === "gif") {
    const src = `/media/${name}${extname(file).toLowerCase()}`;
    copyFileSync(file, join(out, src));
    return { src, width, height };
  }

  const hash = createHash("sha1").update(readFileSync(file)).digest("hex").slice(0, 12);
  const widths = [...new Set([800, 1600].map((w) => Math.min(w, width)))];
  for (const w of widths) {
    const cached = join(CACHE, `${hash}-${w}.webp`);
    if (!existsSync(cached)) {
      mkdirSync(CACHE, { recursive: true });
      await sharp(file).rotate().resize(w).webp({ quality: 80 }).toFile(cached);
    }
    copyFileSync(cached, join(out, `media/${name}-${w}.webp`));
  }
  return {
    src: `/media/${name}-${widths.at(-1)}.webp`,
    srcset: widths.map((w) => `/media/${name}-${w}.webp ${w}w`).join(", "),
    width,
    height,
  };
}
