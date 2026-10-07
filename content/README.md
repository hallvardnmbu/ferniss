# How to update the website

Everything on the website comes from this `content` folder. You never need to
touch any code: add folders, drop in photos, and write in plain text files.
When the changes are saved (or uploaded to GitHub), the website rebuilds itself.

```
content/
├── site.txt                    ← your name, email, the front-page text
├── hero.jpg                    ← (optional) the big photo on the front page
├── collections/
│   ├── 01-askeglasur/          ← one folder per collection / series
│   │   ├── samling.txt         ← about the collection
│   │   ├── 01-maanekrukke/     ← one folder per piece
│   │   │   ├── info.txt        ← title, price, description …
│   │   │   ├── 1.jpg           ← photos, shown in name order
│   │   │   └── 2.jpg
│   │   └── 02-hoy-flaske/
│   └── 02-tidevann/
└── pages/
    └── 01-om/                  ← extra pages, like "About" or "Courses"
        ├── side.txt
        └── portrett.jpg
```

## Adding a new piece

1. Open the collection folder it belongs to.
2. Make a new folder, for example `05-liten-vase`.
   The number in front decides the order; it's not shown anywhere.
3. Put the photos in it. The first one (by name) is the main photo, so naming
   them `1.jpg`, `2.jpg`, `3.jpg` works well. Photos straight from your phone
   are fine; they're resized automatically.
4. Make a text file (any name, e.g. `info.txt`) like this:

```
Title: Liten vase
Price: 1 200 kr
Status: Available
Featured: yes
Clay: Stoneware
Glaze: Ash
Size: H 14 cm
---
Write the description here, as long or short as you like.

An empty line starts a new paragraph.
```

The lines **above** the `---` are details; everything **below** it is the
description. (If you leave out `---`, the first empty line does the same job.)

### The details

| Field       | What it does                                                            |
|-------------|-------------------------------------------------------------------------|
| `Title`     | The name of the piece. Without it, the folder name is used.            |
| `Price`     | Written exactly as you type it: `1 200 kr`, `450 kr per stk.`, …       |
| `Status`    | `Available`, `Reserved`, `Sold`, `Commission` or `Not for sale`.       |
| `Featured`  | `yes` puts it on the front page.                                        |
| `Cover`     | The file name of the photo to show first, if not the first by name.    |
| `Order`     | A number, if you'd rather sort this way than by folder name.           |
| `Hidden`    | `yes` keeps it off the website (handy for drafts).                      |

**Any other line becomes a detail on the piece's label:** `Clay`, `Glaze`,
`Size`, `Year`, `Dishwasher safe`, anything you like, in the order you write
them.

Norwegian works too: `Tittel`, `Pris`, `Fremhevet: ja`, `Skjult: ja`, and
`Status: Tilgjengelig / Reservert / Solgt / På bestilling / Ikke til salgs`.

Sold pieces get a little red dot, just like in a gallery. Visitors can still ask
for "something similar".

## Collections

A collection is just a folder inside `collections/`. Its text file has a
`Title`, any details you like (such as `Year`), then `---` and a description.
The first photo placed directly in the collection folder becomes its cover;
without one, the first piece's photo is used.

## Pages

Each folder in `pages/` becomes a page in the menu. Besides `Title` you can set:

- `Menu: About me`: a shorter name for the menu.
- `Featured: yes`: shows a teaser of the page on the front page.

Photos in the page folder are shown beside the text. To place a photo inside the
text instead, write `![A description of the photo](portrett.jpg)` on its own line.

## Writing text

- `*italic*` and `**bold**`
- `## A heading`
- Lines starting with `- ` become a list
- A line starting with `> ` becomes a large quote
- `[link text](https://example.com)`, or `[contact me](/contact/)` for a page on this site

## site.txt

```
Name: Ferniss
Tagline: Keramikk dreid for hånd
Location: Verksted i Bergen
Email: post@example.com           ← inquiries go here
Phone: 900 00 000                 (optional)
Instagram: @ferniss.keramikk      (optional)
Language: nb                      ← nb (Norwegian) or en (English)
Accent: #a4532f                   ← the highlight colour
URL: https://www.ferniss.no       (optional, for sharing previews)
Form endpoint: https://formspree.io/f/xxxx   (optional, see below)
---
The introduction text on the front page.
```

### How inquiries reach you

By default, pressing "Send" opens the visitor's own email app with a message to
you already written, including which pieces they're asking about. If you'd
rather have messages sent straight from the website, create a free form at
[Formspree](https://formspree.io) and paste its address into `Form endpoint:`.

## Hiding things

Put an underscore in front of any folder name (`_old-vase`) or write
`Hidden: yes` in its text file, and it disappears from the website.
