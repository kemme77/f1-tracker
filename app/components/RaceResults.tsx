import type { Race, RaceResult } from "@/lib/f1";
import ResultRow from "./ResultRow";

type Props = { race: Race | null; title?: string };

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

export default function RaceResults({ race, title = "Race Results" }: Props) {
  if (!race || !race.Results || race.Results.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-surface p-5 shadow-sm">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted">
          {title}
        </h3>
        <p className="mt-3 text-sm text-muted">
          No results yet — race hasn&apos;t happened.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted">
        {title}
      </h3>
      <p className="text-xs text-muted">{race.raceName}</p>

      <ol className="mt-4 max-h-96 space-y-2 overflow-auto pr-1">
        {race.Results.map((r) => {
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
      </ol>
    </section>
  );
}
