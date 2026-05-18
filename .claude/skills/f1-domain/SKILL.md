---
name: f1-domain
description: Domänen-Wissen für f1-tracker — Koordinaten-Systeme (MultiViewer-Grid vs. bacinger lon/lat), Similarity-Transform, Sector-Split-Ableitung aus OpenF1, Racing-Direction-Handling. Lade diesen Skill bei jeder Änderung an lib/multiviewer.ts, lib/openf1.ts, lib/circuitGeo.ts, lib/sectors.ts oder am Hero-Track-Overlay.
---

# F1 Domain Knowledge

Dieser Skill ist kanonische Referenz für Geo-/Timing-Logik im f1-tracker. Bei Code-Änderungen an `lib/multiviewer.ts` / `lib/openf1.ts` / `lib/circuitGeo.ts` / `lib/sectors.ts` **zuerst diesen Skill laden**, dann editieren.

## Koordinaten-Systeme

| System | Einheit | Quelle | Verwendung |
|--------|---------|--------|------------|
| F1 Positioning Grid | metrisch (x/y) | MultiViewer `x/y`, OpenF1 `location` | Corner-Positionen, S/F-Tick, Car-Traces |
| Geo lon/lat | Grad | bacinger GeoJSON | Circuit-Outline auf Karte |

**Wichtig:** MultiViewer `x/y`, OpenF1 `location` und "F1 positioning grid" sind **derselbe** metrische Grid. Eine **Best-Fit Similarity Transform** (Skalierung + Rotation + Translation, **kein** Shear) brückt zwischen Grid und lon/lat.

## Racing Direction

Manche bacinger Outlines sind **gegen** Racing-Direction gespeichert. `getCircuitOverlay` (`lib/multiviewer.ts`) erkennt das und gibt eine **re-orientierte Kopie** in `coordinates` zurück. Consumer iterieren **forward by index**.

## Indices `undefined`

Bei neuen Strecken ohne MultiViewer-Daten sind Corner-Indices `undefined`:
- Outline trotzdem rendern (nackt).
- **Niemals** Sector-Splits faken oder Corners interpolieren.

## Sector Splits

Korrekte Reihenfolge:
1. OpenF1 lap data → Split-Times pro Sektor (`lib/openf1.ts`)
2. Split-Times → Car-Position zum Split-Zeitpunkt (Trace-Lookup)
3. Car-Position → Outline via **corner-anchored Arc-Length-Warp**

Fallback bei OpenF1-Lücke: `lib/sectors.ts` (hand-picked Corner-Numbers). Nur Fallback, nicht Default.

## Helper-Inventar (`lib/`)

| Helper | Zweck |
|--------|-------|
| `bboxOf` (circuitGeo.ts) | Bounding-Box aus GeoJSON |
| Similarity-Transform (multiviewer.ts) | Grid ↔ lon/lat |
| OpenF1 fetch (openf1.ts) | Lap/Location-Trace, mit `next.revalidate` |
| Jolpica fetch (f1.ts) | Schedule/Results/Standings |

**Regel:** Vor neuer Utility — `lib/` durchsuchen. Vor Re-Implementierung von Transform-Logik — `lib/multiviewer.ts` lesen.

## Doku-Quellen (kanonisch)

Bei API-Verhaltens-Fragen via `WebFetch`:
- MultiViewer: https://api.multiviewer.app/
- OpenF1: https://openf1.org/
- Jolpica: https://api.jolpi.ca/
- bacinger Circuits: https://github.com/bacinger/f1-circuits

Niemals aus Training raten — F1-APIs sind Nischen, Training ist lückenhaft.
