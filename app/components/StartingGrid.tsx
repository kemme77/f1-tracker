import { getRaceGrid, type Race, type QualifyingEntry } from "@/lib/f1";
import { teamColor } from "@/lib/teamColors";

type Props = { race: Race };

function formatLapTime(result: QualifyingEntry): string {
  const q3 = result.Q3?.trim();
  if (q3) return q3;
  const q2 = result.Q2?.trim();
  if (q2) return q2;
  const q1 = result.Q1?.trim();
  if (q1) return q1;
  return "—";
}
export default async function StartingGrid({ race }: Props) {
  const grid = await getRaceGrid(race.round);

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted">
        Starting Grid
      </h3>
      <p className="text-xs text-muted">
        Qualifying grid for {race.raceName}
      </p>

      {grid.length > 0 ? (
        <ol className="mt-4 max-h-96 space-y-2 overflow-auto pr-1">
          {grid.map((entry) => {
            const color = teamColor(
              entry.Constructor.constructorId,
              entry.Constructor.name,
            );

            return (
              <li
                key={`${entry.Driver.driverId}-${entry.position}`}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
                style={{ borderLeft: `4px solid ${color}` }}
              >
                <span className="w-10 font-mono text-xs text-muted">
                  P{entry.position}
                </span>
                <span className="flex-1 truncate">
                  <span className="block truncate font-semibold">
                    {entry.Driver.familyName}
                    {entry.status ? (
                      <span className="ml-2 inline-block rounded-md bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
                        {entry.status}
                      </span>
                    ) : null}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {entry.Constructor.name}
                  </span>
                </span>
                <span className="font-mono text-sm tabular-nums text-muted">
                  {formatLapTime(entry)}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Grid not available yet for this race.
        </p>
      )}
    </section>
  );
}