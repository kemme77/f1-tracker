# f1-tracker

F1 race dashboard. Next.js 16 + Tailwind 4 + TypeScript + MapLibre GL.

## Features

- **Hero track map** — satellite imagery (Esri World Imagery via MapLibre) with
  the circuit outline, numbered corners, the start/finish line and the three
  timing sectors colour-coded; a caption shows the imagery's capture date,
  source and resolution. Plus countdown and session times.
- **Sector boundaries from live timing** — the S1/S2 splits are derived from a
  real lap in the OpenF1 archive (split times projected onto the car's position
  trace), then mapped onto the outline via a corner-anchored arc-length warp.
  Brand-new circuits with no data show just the bare outline (no faked splits).
- **Race results** — full classification of whichever race is selected: every
  driver in finishing order, with `DNF` (and the retirement reason), `DNS`,
  `DQ` and `NC` shown in place of the position, plus points.
- **Starting grid** — post-penalty grid, aware of pit-lane starts and of
  drivers disqualified in qualifying (kept flagged even after the race runs).
- **Race selector** dropdown with country flags — jump to any round.
- **Schedule timeline** with the current round highlighted.
- **Winner prediction** — standings + circuit-history heuristic.
- **Driver and Constructor standings.**
- Live ticker placeholder (further OpenF1 integration planned).

## Data sources

- [Jolpica F1 API](https://api.jolpi.ca/) — Ergast-compatible schedule, results,
  qualifying and standings (no key required)
- [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) — circuit
  outline GeoJSON
- [MultiViewer API](https://api.multiviewer.app/) — corner positions and the
  start/finish reference (F1 positioning grid)
- [OpenF1](https://openf1.org/) — lap sector durations and car location traces,
  used to place the timing-sector splits
- [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9)
  — satellite basemap tiles and imagery metadata

## Setup

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Disclaimer

Unofficial fan project — not associated with Formula 1. F1, FORMULA 1, GRAND
PRIX and related marks are trade marks of Formula One Licensing B.V.

## License

Personal project — all rights reserved.
