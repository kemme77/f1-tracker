import type { Race } from "@/lib/f1";
import { teamColor } from "@/lib/teamColors";

const POSITIONS = ["1st", "2nd", "3rd"];

type Props = { race: Race | null; title?: string };

export default function Podium({ race, title = "Race Result" }: Props) {
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

  const top3 = race.Results.slice(0, 3);

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted">
          {title}
        </h3>
        <p className="text-xs text-muted">{race.raceName}</p>
      </div>

      <ol className="space-y-2">
        {top3.map((r, i) => {
          const color = teamColor(
            r.Constructor.constructorId,
            r.Constructor.name,
          );
          return (
            <li
              key={r.Driver.driverId}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <span className="w-8 font-mono text-xs text-muted">
                {POSITIONS[i]}
              </span>
              <span className="flex-1 truncate">
                <span className="block truncate font-semibold">
                  {r.Driver.givenName} {r.Driver.familyName}
                </span>
                <span className="block truncate text-xs text-muted">
                  {r.Constructor.name}
                </span>
              </span>
              <span className="font-mono text-sm tabular-nums">
                {r.Time?.time ?? r.status}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
