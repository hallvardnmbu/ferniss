# Ferniss

A static portfolio site for a ceramic artist. The artist only edits `content/`
([guide, in Norwegian](content/README.md)); `build.js` turns it into plain HTML in `dist/`.

```sh
bun install
bun run dev     # http://localhost:3000, rebuilds on save
bun run build   # → dist/, deploy anywhere static
```

```
lib/content.js   reads content/ (text fields, Markdown via Bun.markdown, images)
lib/images.js    resizes photos to WebP with sharp, cached in .cache/
lib/pages.js     all page templates
assets/          style.css, shelf.js, favicon
build.js         writes dist/
app.js           dev server
```

Visitors can ask about a piece (a pre-filled email), or set several pieces aside
on "Hylla" (kept in localStorage) and send one email about all of them. Unknown
fields in a piece's text file are shown as details, so the artist can add their
own without code changes. The sample pots are SVG stand-ins for real photos.
