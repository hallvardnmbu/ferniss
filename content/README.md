# Slik oppdaterer du nettsiden

Alt på nettsiden hentes fra denne mappen. Lag mapper, legg inn bilder og skriv i
vanlige tekstfiler; nettsiden bygges på nytt når du lagrer.

```
content/
├── innstillinger.txt          navn, e-post og teksten på forsiden
├── samlinger/
│   └── 01-askeglasur/         én mappe per samling
│       ├── samling.txt
│       └── 01-maanekrukke/    én mappe per verk
│           ├── info.txt
│           ├── 1.jpg          bildene vises i navnerekkefølge
│           └── 2.jpg
└── sider/
    └── 01-om/                 egne sider i menyen, som «Om meg»
        ├── side.txt
        └── portrett.jpg
```

Tallet foran mappenavnene bestemmer rekkefølgen og vises ikke på siden. Sett en
understrek foran et mappenavn (`_utkast`) for å skjule det.

## Et verk

```
Tittel: Høy flaske
Pris: 3 400 kr
Status: Tilgjengelig
Fremhevet: ja
Leire: Steintøy
Glasur: Eikeaske
Størrelse: H 38 cm
---
Beskrivelsen skrives under streken. En tom linje gir nytt avsnitt.
```

- **Status:** Tilgjengelig, Reservert, Solgt, På bestilling eller Ikke til salgs.
  Solgte verk får en rød prikk.
- **Fremhevet: ja** viser verket på forsiden.
- **Alle andre linjer** (Leire, Glasur, Størrelse, År …) vises som detaljer på verket.

Samlinger og sider har bare `Tittel` (og sider kan ha `Meny: Om meg` for et
kortere navn i menyen), så streken og teksten.

## innstillinger.txt

```
Navn: Ferniss
Undertittel: Keramikk dreid for hånd
Sted: Verksted i Bergen
E-post: post@example.com
Telefon: 900 00 000
Instagram: @ferniss.keramikk
---
Teksten på forsiden.
```

## Tekst og bilder

`*kursiv*`, `**fet**`, `## overskrift`, `- liste`, `> sitat` og
`[lenke](/kontakt/)` fungerer i all tekst.

Bilder kan være JPG, PNG, WebP, AVIF, GIF eller SVG, og skaleres ned automatisk.
iPhone lagrer som HEIC, som nettlesere ikke kan vise. Bytt til JPG under
*Innstillinger → Kamera → Formater → Mest kompatibel*.
