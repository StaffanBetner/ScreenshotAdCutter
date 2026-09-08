# ✂️ Screenshot Ad Cutter

Klipp smidigt bort reklam och oönskade sektioner i höjdled från långa skärmdumpar och foga samman resten till en ren, sammanhängande bild.

Perfekt när du vill arkivera en lång artikel som skärmdump utan att banners, nyhetsbrevspuffar och sponsrat innehåll tar upp halva bilden.

## Funktioner

- **Dra-och-släpp / klistra in** – ladda en skärmdump via filväljare, drag & drop eller klistra in direkt från urklipp (`Ctrl+V` var som helst i appen).
- **Manuella klippzoner** – markera snabbt och exakt genom att dra över oönskade sektioner på bilden, eller lägg till zoner via sidopanelen. Zonerna kan flyttas, finjusteras, döpas om, aktiveras/avaktiveras och tas bort.
- **Ångra / gör om** – fullständig historik (`Ctrl+Z` / `Ctrl+Y` / `Ctrl+Shift+Z`).
- **Minikarta** – snabb överblick och navigering i långa bilder.
- **Tre vyer** – redigerare, ren förhandsgranskning och delad före/efter-jämförelse.
- **Export** – ladda ner den sammansatta rena bilden som PNG eller kopiera den direkt till urklipp.
- **Exempelartikel** – genererar en realistisk svensk artikel-skärmdump med tre inbakade annonser så att du kan testa verktyget direkt utan egen bild.
- **Mobilanpassat** – smidig nedre verktygsrad och zoner-panel som drawer på små skärmar.

## Så fungerar det

1. Klistra in eller släpp en lång skärmdump (t.ex. en skrollande skärmdump av en artikel).
2. Markera sektioner du vill klippa bort genom att klicka och dra över områdena i höjdled, eller via knappen **+ Klippzon**.
3. De markerade zonerna klipps bort och de kvarvarande segmenten fogas sömlöst ihop via en offscreen-canvas (`src/utils/stitcher.ts`).
4. Granska i vyn **Ren bild** eller i den delade jämförelsen, och exportera sedan som PNG eller kopiera till urklipp.

All bildbehandling sker lokalt i webbläsaren – inga bilder skickas till någon server.

## Kom igång

```bash
npm install
npm run dev
```

Dev-servern startar på `http://localhost:3000`.

### Övriga kommandon

| Kommando          | Beskrivning                           |
|-------------------|---------------------------------------|
| `npm run dev`     | Startar Vite-devserver (port 3000)    |
| `npm run build`   | Bygger produktionsversion till `dist` |
| `npm run preview` | Förhandsgranskar produktionsbygget    |
| `npm run lint`    | Typecheckar med `tsc --noEmit`        |
| `npm run clean`   | Rensar `dist` och `server.js`         |

## Teknikstack

- **React 19** + **TypeScript**
- **Vite 6** (devserver och bygge)
- **Tailwind CSS 4** (via `@tailwindcss/vite`)
- **lucide-react** (ikoner)
- **Canvas 2D API** för bildanalys och sammansättning
- Byggd som en AI Studio-applikation (Google Gemini-miljö)

## Projektstruktur

```
src/
├── App.tsx                  # Huvudkomponent, state-hantering, genvägar
├── types.ts                 # Delade typer (CutZone, ImageInfo, ViewMode …)
├── components/
│   ├── Header.tsx           # Övre verktygsrad
│   ├── EditorCanvas.tsx     # Bildyta där klippzoner ritas/justeras
│   ├── CutZonesSidebar.tsx  # Sidopanel med zoner och inställningar
│   ├── Minimap.tsx          # Minikarta för navigering
│   ├── CleanPreview.tsx     # Förhandsgranskning av ren bild
│   ├── SplitComparison.tsx  # Delad före/efter-vy
│   └── EmptyDropzone.tsx    # Startvy / filuppladdning
└── utils/
    ├── stitcher.ts          # Sammansättning av bild + exempelartikelgenerator
    └── stitchCache.ts       # Cache för sammansatta canvases
```

## Tangentbordsgenvägar

| Genväg                          | Funktion                     |
|---------------------------------|------------------------------|
| `Ctrl/Cmd + V`                  | Klistra in bild från urklipp |
| `Ctrl/Cmd + Z`                  | Ångra                        |
| `Ctrl/Cmd + Y` / `Ctrl+Shift+Z` | Gör om                       |
| `Delete` / `Backspace`          | Ta bort markerad klippzon    |

## Bakgrund

Det här projektet är vibecodat med **Gemini 3.8 Flash** i Google AI Studio.
