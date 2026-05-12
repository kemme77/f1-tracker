<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project notes

Stack: Next.js 16 (Turbopack), React 19, Tailwind 4, TypeScript, MapLibre GL.

## Data

All race data (schedule, results, qualifying, standings) comes from the Jolpica
F1 API (Ergast-compatible) via `lib/f1.ts`. Other external APIs — MultiViewer,
OpenF1, Esri World Imagery, bacinger/f1-circuits — are keyless; every `fetch` to
them passes `next: { revalidate: ... }` for caching. No env vars / secrets.

## Track overlay (`lib/multiviewer.ts`)

`getCircuitOverlay` builds the hero map's numbered corners, S/F tick and the
three timing-sector splits. Key facts:

- MultiViewer's `x`/`y`, OpenF1's `location` and "the F1 positioning grid" are
  the *same* metric coordinate grid; bacinger GeoJSON is lon/lat. A best-fit
  similarity transform bridges them.
- Some bacinger outlines are stored against the racing direction — the overlay
  detects this and returns a re-oriented copy in `coordinates`; consumers walk
  it forwards by index. Indices may be `undefined` (new circuit, no MV data) —
  then draw the bare outline, don't fake splits.
- Sector splits come from a real lap in `lib/openf1.ts` (split times → car
  position → corner-anchored arc-length warp onto the outline). `lib/sectors.ts`
  (hand-picked corner numbers) is only the fallback when OpenF1 has no data.

## Before committing

`npx tsc --noEmit` · `npx eslint .` · `npm run build`. Branch off `main`, merge
fast-forward, push; no PR flow.
