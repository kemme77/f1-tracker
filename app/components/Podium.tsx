import { getLastRaceResults } from "@/lib/f1";
import { teamColor } from "@/lib/teamColors";

const POSITIONS = ["1st", "2nd", "3rd"];

export default async function Podium() {
  const race = await getLastRaceResults();
  if (!race || !race.Results) return null;

  const top3 = race.Results.slice(0, 3);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Last Race
        </h3>
        <p className="text-sm font-medium">{race.raceName}</p>
      </div>

      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {top3.map((r, i) => {
          const color = teamColor(
            r.Constructor.constructorId,
            r.Constructor.name,
          );
          return (
            <li
              key={r.Driver.driverId}
              className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <p className="text-xs font-mono text-zinc-500">{POSITIONS[i]}</p>
              <p className="mt-1 font-semibold">
                {r.Driver.givenName} {r.Driver.familyName}
              </p>
              <p className="text-xs text-zinc-500">{r.Constructor.name}</p>
              <p className="mt-2 font-mono text-sm tabular-nums">
                {r.Time?.time ?? r.status}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
