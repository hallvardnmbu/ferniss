# Ferniss

A static portfolio website for a ceramic artist, generated from a plain folder of
text files and photos. The artist edits `content/` and nothing else
([guide](content/README.md)); the build turns it into a fast, dependency-free site.

```sh
bun install       # optional: enables image resizing (sharp)
bun run dev       # http://localhost:3000, rebuilds on every save
bun run build     # → dist/
```

`node build.js` works too. Environment variables: `BASE_PATH` (for example
`/ferniss/` when hosted in a sub-folder), `CONTENT_DIR`, `OUT_DIR`.

## What the visitor gets

- **Front page:** the artist's name set large, a photo in an arch (the shape of a
  kiln door) circled by slowly rotating text, featured pieces, collections and
  an "About" teaser.
- **Works:** every piece, filterable by collection and availability. The filter
  is kept in the URL so it can be shared. Sold work gets a red dot, as in a gallery.
- **Piece pages:** photo gallery with lightbox, a museum-style label with the
  artist's own detail fields, and an **inquiry form for that piece** that opens
  in place. The text adapts to the status: "ask about this piece", "ask about a
  similar one", "order a similar one". The page background takes on a faint
  tint of the glaze, sampled from the photo.
- **The shelf (Hylla):** visitors collect pieces they're curious about, then
  send one inquiry covering all of them. It's kept in the browser; no backend.
- **Inquiries** open the visitor's email app pre-filled (subject, pieces,
  prices, links). Set `Form endpoint:` (e.g. Formspree) to post directly instead.
- Norwegian or English interface, dark mode, responsive, works without
  JavaScript, sitemap, Open Graph tags and a 404 page.

## How it's put together

```
content/          the artist's folder (the only thing they edit)
lib/content.js    reads content/ into a data model; forgiving, warns instead of failing
lib/markdown.js   a small Markdown subset for descriptions
lib/images.js     resizes photos to WebP + srcset with sharp, cached in .cache/
lib/imagesize.js  reads image dimensions (incl. EXIF rotation) from file headers
lib/i18n.js       interface text (nb, en); add a language by copying a block
templates/        layout, components and one function per page type
assets/           style.css, site.js (progressive enhancement), favicon
build.js          renders everything to dist/
app.js            dev server with rebuild-on-change
```

Text files are a few `Key: value` lines, then `---`, then free text. Known keys
(`Title`, `Price`, `Status` …, plus Norwegian aliases) drive behaviour. **Any
unknown key is shown as a detail on the label**, so the artist can add fields
like `Glaze` or `Firing` without code changes. Folder names give the order (`01-…`)
and slugs (`Måne krukke` → `mane-krukke`).

Theming: colours are CSS variables at the top of `assets/style.css`; `Accent:`
in `site.txt` overrides `--accent`.

## Deploying

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push
to `main` (enable it under *Settings → Pages → Source: GitHub Actions*). The
artist can then upload photos and edit text straight in GitHub's web interface.
`dist/` is plain static files, so any other static host works as well.

The sample pots are SVG illustrations standing in for real photos.
