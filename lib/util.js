// Small helpers shared by the generator.

export const esc = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// "03-Måne krukke" -> "mane-krukke"
export const slugify = (value) => fileSlug(stripOrder(value)) || "untitled";

// Like slugify, but keeps numbers in front: "2 Detalj" -> "2-detalj".
export const fileSlug = (value) =>
  value
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Folder names may start with a number to control ordering: "01-moon-jar".
export const stripOrder = (name) => name.replace(/^\d+[\s._-]+/, "");

// "01-moon_jar" -> "Moon jar"
export const prettify = (name) => {
  const text = stripOrder(name).replace(/[-_]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const isTruthy = (value) =>
  /^(yes|ja|true|x|1|on|y|j)$/i.test(String(value ?? "").trim());

export const naturalCompare = (a, b) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

// Serialize JSON safely for inline <script> tags.
export const inlineJson = (value) =>
  JSON.stringify(value).replace(/</g, "\\u003c");
