// A deliberately small Markdown subset — enough for an artist's descriptions:
//   paragraphs, # headings, - lists, > quotes, **bold**, *italic*,
//   [links](https://…) and ![images](file.jpg) from the same folder.
import { esc } from "./util.js";

const inline = (text, resolveImage, base) =>
  esc(text)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => {
      const image = resolveImage?.(src);
      if (!image) return "";
      const size = image.width ? ` width="${image.width}" height="${image.height}"` : "";
      return `<img data-media="${image.path}" alt="${alt}"${size} loading="lazy" class="prose-img">`;
    })
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
      const external = /^https?:/.test(href);
      // "/contact/" means this site's contact page, wherever the site is hosted.
      if (href.startsWith("/") && !href.startsWith("//")) href = (base ?? "/") + href.slice(1);
      return `<a href="${href}"${external ? ' rel="noopener" target="_blank"' : ""}>${label}</a>`;
    })
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/g, "$1<em>$2</em>");

export function markdown(source = "", resolveImage, base) {
  const blocks = source.trim().split(/\n\s*\n/).filter(Boolean);
  return blocks
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trimEnd());
      const heading = lines[0].match(/^(#{1,3})\s+(.*)$/);
      if (heading && lines.length === 1) {
        const level = heading[1].length + 1; // the page title is the only <h1>
        return `<h${level}>${inline(heading[2], resolveImage, base)}</h${level}>`;
      }
      if (lines.every((line) => /^\s*[-*•]\s+/.test(line))) {
        const items = lines.map((line) => `<li>${inline(line.replace(/^\s*[-*•]\s+/, ""), resolveImage, base)}</li>`);
        return `<ul>${items.join("")}</ul>`;
      }
      if (lines.every((line) => /^>\s?/.test(line))) {
        return `<blockquote><p>${lines.map((line) => inline(line.replace(/^>\s?/, ""), resolveImage, base)).join("<br>")}</p></blockquote>`;
      }
      if (lines.length === 1 && /^!\[[^\]]*\]\([^)]+\)$/.test(lines[0].trim())) {
        return `<figure>${inline(lines[0].trim(), resolveImage, base)}</figure>`;
      }
      return `<p>${lines.map((line) => inline(line.trim(), resolveImage, base)).join("<br>")}</p>`;
    })
    .join("\n");
}

// Plain-text version, for excerpts and meta descriptions.
export const plainText = (source = "") =>
  source
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_#>`]/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

export const excerpt = (source, max = 180) => {
  const firstParagraph = plainText(source.trim().split(/\n\s*\n/)[0] ?? "");
  if (firstParagraph.length <= max) return firstParagraph;
  return firstParagraph.slice(0, max).replace(/\s+\S*$/, "") + "…";
};
