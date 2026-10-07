# Slik oppdaterer du nettsiden

Alt på nettsiden hentes fra denne `content`-mappen. Du trenger aldri å røre
koden: lag mapper, legg inn bilder og skriv i vanlige tekstfiler. Når endringene
er lagret, bygges nettsiden på nytt.

```
content/
├── innstillinger.txt           ← navnet ditt, e-post, teksten på forsiden
├── forside.jpg                 ← (valgfritt) det store bildet på forsiden
├── samlinger/
│   ├── 01-askeglasur/          ← én mappe per samling / serie
│   │   ├── samling.txt         ← om samlingen
│   │   ├── 01-maanekrukke/     ← én mappe per verk
│   │   │   ├── info.txt        ← tittel, pris, beskrivelse …
│   │   │   ├── 1.jpg           ← bilder, vises i navnerekkefølge
│   │   │   └── 2.jpg
│   │   └── 02-hoy-flaske/
│   └── 02-tidevann/
└── sider/
    └── 01-om/                  ← egne sider, som «Om meg» eller «Kurs»
        ├── side.txt
        └── portrett.jpg
```

## Legge til et nytt verk

1. Åpne samlingen verket hører til.
2. Lag en ny mappe, for eksempel `05-liten-vase`.
   Tallet foran bestemmer rekkefølgen og vises ikke på nettsiden.
3. Legg bildene i mappen. Det første (etter navn) blir hovedbildet, så det
   fungerer fint å kalle dem `1.jpg`, `2.jpg`, `3.jpg`. Bilder rett fra
   mobilen går fint; de skaleres ned automatisk.
4. Lag en tekstfil (navnet spiller ingen rolle, f.eks. `info.txt`) som dette:

```
Tittel: Liten vase
Pris: 1 200 kr
Status: Tilgjengelig
Fremhevet: ja
Leire: Steintøy
Glasur: Aske
Størrelse: H 14 cm
---
Skriv beskrivelsen her, så lang eller kort du vil.

En tom linje starter et nytt avsnitt.
```

Linjene **over** `---` er detaljer, og alt **under** er beskrivelsen. (Hvis du
dropper `---`, gjør den første tomme linjen samme jobben.)

### Detaljene

| Felt         | Hva det gjør                                                              |
|--------------|---------------------------------------------------------------------------|
| `Tittel`     | Navnet på verket. Uten tittel brukes mappenavnet.                         |
| `Pris`       | Vises akkurat som du skriver den: `1 200 kr`, `450 kr per stk.` …         |
| `Status`     | `Tilgjengelig`, `Reservert`, `Solgt`, `På bestilling` eller `Ikke til salgs`. |
| `Fremhevet`  | `ja` viser verket på forsiden.                                            |
| `Hovedbilde` | Filnavnet på bildet som skal vises først, hvis ikke det første etter navn. |
| `Rekkefølge` | Et tall, hvis du heller vil sortere slik enn etter mappenavn.             |
| `Skjult`     | `ja` holder verket borte fra nettsiden (fint for utkast).                 |

**Alle andre linjer blir en detalj på verkets etikett:** `Leire`, `Glasur`,
`Størrelse`, `År`, `Tåler oppvaskmaskin`, hva du vil, i den rekkefølgen du
skriver dem.

Solgte verk får en liten rød prikk, akkurat som i et galleri. Besøkende kan
fortsatt spørre om «et lignende».

## Samlinger

En samling er bare en mappe inne i `samlinger/`. Tekstfilen har en `Tittel`,
de detaljene du vil (for eksempel `År`), og så `---` og en beskrivelse. Det
første bildet som ligger rett i samlingsmappen blir omslaget; uten et slikt
bilde brukes bildet til det første verket.

## Sider

Hver mappe i `sider/` blir en side i menyen. I tillegg til `Tittel` kan du
skrive:

- `Meny: Om meg`: et kortere navn i menyen.
- `Fremhevet: ja`: viser et utdrag av siden på forsiden.

Bilder i sidemappen vises ved siden av teksten. Vil du heller plassere et bilde
inne i teksten, skriv `![En beskrivelse av bildet](portrett.jpg)` på en egen linje.

## Skrive tekst

- `*kursiv*` og `**fet**`
- `## En overskrift`
- Linjer som starter med `- ` blir en liste
- En linje som starter med `> ` blir et stort sitat
- `[lenketekst](https://example.com)`, eller `[kontakt meg](/kontakt/)` for en side på nettsiden

## Bilder

JPG, PNG, WebP, AVIF, GIF og SVG fungerer. Bildene skaleres ned og gjøres
lette automatisk, så du trenger ikke å tenke på størrelsen.

iPhone lagrer bilder som HEIC, og det formatet kan ikke nettlesere vise. Lagre
dem som JPG i stedet: *Innstillinger → Kamera → Formater → Mest kompatibel*.

## innstillinger.txt

```
Navn: Ferniss
Undertittel: Keramikk dreid for hånd
Sted: Verksted i Bergen
E-post: post@example.com          ← forespørsler sendes hit
Telefon: 900 00 000               (valgfritt)
Instagram: @ferniss.keramikk      (valgfritt)
Farge: #a4532f                    ← fremhevingsfargen
Nettadresse: https://www.ferniss.no   (valgfritt, for forhåndsvisning når siden deles)
Skjema: https://formspree.io/f/xxxx   (valgfritt, se under)
---
Introduksjonsteksten på forsiden.
```

### Hvordan forespørsler når deg

Når noen trykker «Send», åpnes e-postprogrammet deres med en ferdig skrevet
melding til deg, inkludert hvilke verk de spør om. Vil du heller at meldinger
sendes rett fra nettsiden, lag et gratis skjema hos
[Formspree](https://formspree.io) og lim inn adressen etter `Skjema:`.

## Skjule ting

Sett en understrek foran et mappenavn (`_gammel-vase`) eller skriv `Skjult: ja`
i tekstfilen, så forsvinner det fra nettsiden.
