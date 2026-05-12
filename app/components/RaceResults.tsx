import type { Race, RaceResult } from "@/lib/f1";
import ResultsPanel from "./ResultsPanel";
import ResultRow from "./ResultRow";

type Props = { race: Race | null; raceName: string; title?: string };

type Kind = "classified" | "DNF" | "DNS" | "DQ" | "NC";

function classify(r: RaceResult): Kind {
  const st = (r.status ?? "").trim().toLowerCase();
  const pt = (r.positionText ?? "").trim();
  if (st === "disqualified" || pt === "D" || pt === "E") return "DQ";
  if (st === "did not start" || st === "withdrew" || pt === "W" || pt === "F") return "DNS";
  if (st === "not classified" || pt === "N") return "NC";
  if (pt === "R") return "DNF";
  if (/^\d+$/.test(pt)) return "classified";
  return "DNF";
}

function primaryText(r: RaceResult, kind: Kind): string {
  if (kind === "classified") return r.Time?.time ?? r.status;
  if (kind === "NC") return `${r.laps} laps`;
  return r.status; // retirement reason / "Did not start" / "Disqualified"
}

export default function RaceResults({ race, raceName, title = "Race Results" }: Props) {
  const results = race?.Results ?? [];
  return (
    <ResultsPanel
      title={title}
      subtitle={raceName}
      empty={results.length === 0 ? "No results yet — race hasn't happened." : undefined}
    >
      {results.map((r) => {
        const kind = classify(r);
        return (
          <ResultRow
            key={r.Driver.driverId}
            pos={r.position}
            statusLabel={kind === "classified" ? undefined : kind}
            name={`${r.Driver.givenName} ${r.Driver.familyName}`}
            teamId={r.Constructor.constructorId}
            teamName={r.Constructor.name}
            primary={primaryText(r, kind)}
            points={Number(r.points)}
          />
        );
      })}
    </ResultsPanel>
  );
}
