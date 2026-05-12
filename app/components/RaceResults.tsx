import type { Race, RaceResult } from "@/lib/f1";
import { teamColor } from "@/lib/teamColors";

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

const BADGE: Record<Exclude<Kind, "classified">, { label: string; cls: string }> = {
  DNF: { label: "DNF", cls: "text-muted" },
  DNS: { label: "DNS", cls: "text-muted" },
  NC: { label: "NC", cls: "text-muted" },
  DQ: { label: "DQ", cls: "text-f1" },
};

function rightText(r: RaceResult, kind: Kind): string {
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
          const color = teamColor(
            r.Constructor.constructorId,
            r.Constructor.name,
          );
          const pts = Number(r.points);
          return (
            <li
              key={r.Driver.driverId}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <span className="w-8 shrink-0 text-center font-mono text-xs">
                {kind === "classified" ? (
                  <span className="tabular-nums text-muted">{r.position}</span>
                ) : (
                  <span className={`font-semibold ${BADGE[kind].cls}`}>
                    {BADGE[kind].label}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {r.Driver.givenName} {r.Driver.familyName}
                </span>
                <span className="block truncate text-xs text-muted">
                  {r.Constructor.name}
                </span>
              </span>
              {Number.isFinite(pts) && pts > 0 && (
                <span className="shrink-0 font-mono text-xs text-muted tabular-nums">
                  +{pts}
                </span>
              )}
              <span className="shrink-0 font-mono text-sm tabular-nums">
                {rightText(r, kind)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
