# ✂️ Screenshot Ad Cutter

Effortlessly cut out ads, banners, and unwanted vertical sections from long scrolling screenshots and stitch the rest into a clean, continuous, high-resolution image.

Perfect for archiving long web articles as screenshots without banners, newsletter signups, sticky promos, or sponsored content cluttering the reading flow.

🌐 **Live demo:** [https://staffanbetner.github.io/ScreenshotAdCutter/](https://staffanbetner.github.io/ScreenshotAdCutter/)

---

## 🌍 Language Support (English & Swedish)

Screenshot Ad Cutter is fully bilingual (**English** and **Swedish**):
- **Automatic Language Detection:** Automatically detects your browser's preferred language (`navigator.language`). If Swedish is detected, the UI displays in Swedish; otherwise, it defaults to English.
- **Manual Switcher:** You can switch between **EN** and **SV** at any time using the language toggle in the top header. Your preference is saved locally.

---

## 🔒 100% Local & Private

All image processing, cutting, and stitching happens **locally inside your web browser** using the native HTML5 Canvas 2D API.
- **Zero Server Uploads:** Your screenshots and data never leave your device.
- **Works Offline:** No network requests are made during image editing or export.

---

## Key Features

- **Drag-and-Drop & Paste:** Load screenshots via file picker, drag & drop, or paste directly from your clipboard (`Ctrl+V` / `Cmd+V` anywhere in the app).
- **Interactive Manual Cut Zones:** Click and drag directly over the image to define ad sections. Move, resize, rename, toggle, or delete zones with live pixel feedback.
- **Undo & Redo:** Full undo/redo history (`Ctrl+Z`, `Ctrl+Y` / `Cmd+Shift+Z`).
- **Minimap Navigation:** Quick overview and smooth jumping through very tall mobile screenshots.
- **Three Dedicated Views:**
  - **Editor Canvas:** Visual zone marking with draggable handles, edge nudging, and 100% / fit zoom.
  - **Clean Preview:** Inspect the final stitched article with optional seam markers and quality badges.
  - **Split Comparison:** Side-by-side synchronized comparison showing original cuts alongside the clean result.
- **Fast Export:** Download the stitched result as a lossless PNG or copy it directly to your clipboard.
- **Instant Sample Article:** Generate a realistic sample article in English or Swedish with 3 embedded ads to test immediately without needing your own screenshot.
- **Responsive Mobile Experience:** Built-in mobile bottom bar and slide-up drawer for convenient touch control.

---

## How It Works

1. **Paste or upload** a long screenshot (e.g. a full-page capture of an online article).
2. **Mark unwanted sections** by dragging over ad interruptions vertically, or via the **+ Cut Zone** button.
3. The selected zones are removed, and the remaining content slices are seamlessly stitched together in real time on an offscreen canvas (`src/utils/stitcher.ts`).
4. **Preview** in the clean view or side-by-side comparison, then download as PNG or copy to your clipboard.

---

## Getting Started

```bash
npm install
npm run dev
```

The development server starts at `http://localhost:3000`.

### Available Scripts

| Command           | Description                           |
|-------------------|---------------------------------------|
| `npm run dev`     | Starts Vite development server (port 3000) |
| `npm run build`   | Builds production bundle to `dist/`   |
| `npm run preview` | Previews the production build         |
| `npm run lint`    | Type-checks codebase (`tsc --noEmit`) |
| `npm run clean`   | Cleans `dist` and build artifacts     |

---

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 6** (build tool and dev server)
- **Tailwind CSS 4** (via `@tailwindcss/vite`)
- **lucide-react** (crisp UI icons)
- **HTML5 Canvas 2D API** for sub-pixel image slicing and stitching
- Built as a Google AI Studio application (Gemini 3.8 Flash environment)

---

## Project Structure

```
src/
├── App.tsx                  # Main app component, state, shortcuts & toasts
├── i18n.ts                  # Bilingual translations (EN/SV) & language detector
├── types.ts                 # TypeScript types (CutZone, ImageInfo, ViewMode, etc.)
├── components/
│   ├── Header.tsx           # Top navigation bar, language switch, actions
│   ├── EditorCanvas.tsx     # Interactive canvas for drawing and adjusting cut zones
│   ├── CutZonesSidebar.tsx  # Sidebar list with stats, edge adjustments, and controls
│   ├── Minimap.tsx          # Minimap for navigating long vertical screenshots
│   ├── CleanPreview.tsx     # Clean preview with zoom, seam markers, and download
│   ├── SplitComparison.tsx  # Side-by-side synchronized comparison view
│   └── EmptyDropzone.tsx    # Welcome dropzone, privacy notice & sample generator
└── utils/
    ├── stitcher.ts          # Slicing & stitching logic + localized sample article generator
    └── stitchCache.ts       # Canvas caching for fast preview renders
```

---

## Keyboard Shortcuts

| Shortcut                        | Action                       |
|---------------------------------|------------------------------|
| `Ctrl/Cmd + V`                  | Paste image from clipboard   |
| `Ctrl/Cmd + Z`                  | Undo                         |
| `Ctrl/Cmd + Y` / `Ctrl+Shift+Z` | Redo                         |
| `Delete` / `Backspace`          | Delete selected cut zone     |

---

## Svensk sammanfattning (Swedish Summary)

Screenshot Ad Cutter finns tillgänglig på både svenska och engelska. Webbläsarens språk känns av automatiskt, och du kan när som helst byta språk i sidhuvudet. All bildbehandling sker lokalt i din webbläsare – inga bilder eller filer laddas någonsin upp till någon server.

---

## Credits

Vibecoded with **Gemini 3.8 Flash** in Google AI Studio.
GitHub Repository: [https://github.com/StaffanBetner/ScreenshotAdCutter](https://github.com/StaffanBetner/ScreenshotAdCutter)
