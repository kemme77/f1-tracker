# f1-tracker

F1 race tracker dashboard. Next.js 16 + Tailwind 4 + TypeScript.

## Features

- Hero card: track outline (SVG), countdown, session times
- Race selector dropdown with country flags (jump to any round)
- Schedule timeline with current-round highlight
- Starting grid (post-penalty/DQ aware)
- Last-race podium with team colors
- Top-3 winner prediction (standings + circuit history heuristic)
- Driver + Constructor standings
- Live ticker placeholder (OpenF1 integration planned)

## Data sources

- [Jolpica F1 API](https://api.jolpi.ca/) — Ergast-compatible, no key required
- [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) — circuit GeoJSON

## Setup

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## License

Personal project — all rights reserved.
