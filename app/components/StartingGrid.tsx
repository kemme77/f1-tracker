import { getRaceGrid, type Race, type QualifyingEntry } from "@/lib/f1";
import ResultRow from "./ResultRow";

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
      <p className="text-xs text-muted">Qualifying grid for {race.raceName}</p>

      {grid.length > 0 ? (
        <ol className="mt-4 max-h-96 space-y-2 overflow-auto pr-1">
          {grid.map((entry) => (
            <ResultRow
              key={`${entry.Driver.driverId}-${entry.position}`}
              pos={entry.position}
              statusLabel={entry.status}
              name={`${entry.Driver.givenName} ${entry.Driver.familyName}`}
              teamId={entry.Constructor.constructorId}
              teamName={entry.Constructor.name}
              primary={formatLapTime(entry)}
            />
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Grid not available yet for this race.
        </p>
      )}
    </section>
  );
}
