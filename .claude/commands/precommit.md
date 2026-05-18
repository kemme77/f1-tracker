---
description: Pre-Commit-Pipeline für f1-tracker — tsc, eslint, build. Pflicht vor jedem Commit auf main.
---

# /precommit

Führe die vorgeschriebenen Pre-Commit-Checks aus. Quelle: `CLAUDE.md` / `AGENTS.md`.

## Schritte

1. **Type-Check**
   ```bash
   npx tsc --noEmit
   ```
2. **Lint**
   ```bash
   npx eslint .
   ```
3. **Build**
   ```bash
   npm run build
   ```

## Verhalten

- Jeden Schritt sequenziell ausführen.
- Bei **Fehler in einem Schritt:** abbrechen, Fehlertext exakt zitieren, kurzen Fix-Vorschlag anbieten. Nicht weitermachen.
- Bei **allen grün:** kompakt melden "tsc ok, eslint ok, build ok — ready to commit".
- **Niemals** automatisch commiten — User entscheidet.

## Hintergrund

f1-tracker hat keine CI. Pre-Commit-Pipeline ist letzte Verteidigung gegen broken `main`. Branch off `main`, fast-forward merge, push — kein PR-Flow.
