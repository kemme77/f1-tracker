# Projekt-Kontext — f1-tracker

> Diese Datei wird beim Start jeder Claude Code Session automatisch geladen. Sie ist die kanonische Quelle für Projekt-Kontext, Tech Stack und Konventionen. Persönliche Overrides gehören in `CLAUDE.local.md` (gitignored).
>
> Für nicht-Claude-Agents existiert parallel `AGENTS.md` (universelles Agent-Format). Inhalte hier sind die maßgebliche Version für Claude — bei Konflikt gilt diese Datei.

## Projekt

- **Name:** f1-tracker
- **Zweck:** Formula-1-Race-Dashboard. Hero-Map mit Satellitenbild, Strecken-Outline, nummerierte Kurven, S/F-Tick, sektor-eingefärbte Timing-Splits; dazu Starting Grid, Race Results, Standings, Race Selector, Schedule, Winner Prediction.
- **Status:** Aktive Weiterentwicklung. Personal Fan-Project, keine F1-Affiliation.

## Tech Stack (verifiziert via `package.json`)

> **Auto-Detect Regel:** Bei Stack-Änderung (neue Lib, Major-Bump) erneut auflisten, vom User verifizieren, dann Doku-URL aktualisieren. **Doku-URLs sind kanonische Wissensquelle** — bei API-/Verhaltens-Fragen `WebFetch` auf die URL statt aus Memory raten.

- **Framework:** Next.js 16.2.6 (Turbopack via `--webpack` Dev) — Doku: https://nextjs.org/docs
  - **WARNUNG:** Next.js 16 hat Breaking Changes ggü. älteren Versionen. Training-Daten sind veraltet. Vor neuem App-Router-/Server-Component-Code: relevante Page in `node_modules/next/dist/docs/` lesen oder Doku-URL fetchen. Deprecation-Hinweise im Build-Output beachten.
- **UI:** React 19.2.4 — Doku: https://react.dev
- **Sprache:** TypeScript 5 — Doku: https://www.typescriptlang.org/docs/
- **Styling:** Tailwind CSS 4 (`@tailwindcss/postcss`) — Doku: https://tailwindcss.com/docs
- **Karten:** MapLibre GL 5.24 — Doku: https://maplibre.org/maplibre-gl-js/docs/
- **Lint:** ESLint 9 + `eslint-config-next` 16.2.4 — Doku: https://eslint.org/docs/latest/
- **Node:** siehe `.nvmrc`

## Datenquellen (alle keyless, mit `next.revalidate`-Caching)

- **Jolpica F1 API** (Ergast-kompatibel) — Schedule, Results, Qualifying, Standings. Wrapper: `lib/f1.ts`. Doku: https://api.jolpi.ca/
- **MultiViewer API** — Corner-Positionen + S/F-Referenz (F1-Positioning-Grid). Doku: https://api.multiviewer.app/
- **OpenF1** — Lap-Sector-Durations + Car-Location-Traces für Sector-Split-Placement. Wrapper: `lib/openf1.ts`. Doku: https://openf1.org/
- **bacinger/f1-circuits** — Circuit-Outline-GeoJSON (lon/lat). Repo: https://github.com/bacinger/f1-circuits
- **Esri World Imagery** — Satellite-Basemap-Tiles + Imagery-Metadaten

Keine Env-Vars, keine Secrets.

## Domain-Knowledge (kritisch)

### Track Overlay (`lib/multiviewer.ts` → `getCircuitOverlay`)

Baut nummerierte Corners, S/F-Tick, drei Timing-Sector-Splits für die Hero-Map.

- MultiViewer `x`/`y`, OpenF1 `location` und "F1 positioning grid" sind **derselbe** metrische Koordinaten-Grid.
- bacinger GeoJSON ist **lon/lat**.
- Brücke zwischen beiden: **Best-Fit Similarity Transform**.
- Manche bacinger Outlines sind **gegen** Racing-Direction gespeichert. Overlay erkennt das und gibt eine re-orientierte Kopie in `coordinates` zurück. Consumer iterieren forward by index.
- Indices können `undefined` sein (neue Strecke, keine MV-Daten) → in dem Fall **nur das nackte Outline rendern, niemals Splits faken**.
- Sector-Splits stammen aus echter Lap in `lib/openf1.ts`: Split-Times → Car-Position → Corner-anchored Arc-Length-Warp aufs Outline.
- `lib/sectors.ts` (hand-picked Corner-Numbers) ist **nur Fallback**, wenn OpenF1 keine Daten liefert.

## Konventionen

- **Data-Panels = async Server Components, fetchen eigene Daten**, gewrappt in `<Suspense>` in `app/page.tsx` (Beispiele: `StartingGrid`, `RaceResults`, `HeroTrack`). **Keine** Wrapper-Komponenten einführen, die ein pre-fetched Promise nehmen. Pattern beibehalten.
- **Zwei Panels mit gleicher Daten-Shape teilen Markup** — z.B. Starting Grid + Race Results nutzen beide `ResultRow` innerhalb `ResultsPanel`. Vor Duplikat: vorhandenes erweitern.
- **Helpers aus `lib/` wiederverwenden statt neu ableiten** (z.B. `bboxOf` in `lib/circuitGeo.ts`). Vor neuer Utility: `lib/` prüfen.
- **Kommentare:** WHY nicht WHAT. Keine PR-/Issue-Referenzen im Code.

## Testing

Aktuell **keine Test-Suite**. Verifikation via:
- `npx tsc --noEmit` — Type-Check
- `npx eslint .` — Lint
- `npm run build` — Full Build
- Manuell: `npm run dev`, http://localhost:3000

## Git Workflow

- Branch off `main`, **fast-forward Merge**, push. Kein PR-Flow.
- Pre-Commit Pflicht: `npx tsc --noEmit && npx eslint . && npm run build` — siehe `/precommit` Slash-Command.
- Niemals `--force` auf `main`.

## Wichtige Pfade

- `app/` — App Router, Server Components, `app/api/` Routes, `layout.tsx`, `page.tsx`
- `app/components/` — Client/Server Components der UI
- `lib/` — Domain-Utils:
  - `f1.ts` — Jolpica Wrapper
  - `multiviewer.ts` — Circuit Overlay Builder, Similarity Transform
  - `openf1.ts` — Lap-Daten + Car-Trace
  - `circuitGeo.ts` — Geo-Helpers (`bboxOf` etc.)
  - `sectors.ts` — Fallback hand-picked corner numbers
  - `satellite.ts` — Esri Imagery + Metadata
  - `flags.ts`, `teamColors.ts`, `formatDate.ts`, `circuitMap.ts`, `siteConfig.ts`
- `to-do.txt` — lokal, gitignored

## Persönliche Overrides

Individuelle Präferenzen (Sprache, Antwortstil) gehören in `CLAUDE.local.md` (gitignored). Wird zusätzlich zu dieser Datei geladen.
