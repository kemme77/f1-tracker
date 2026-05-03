import {
  getConstructorStandings,
  getDriverStandings,
  type ConstructorStanding,
  type DriverStanding,
} from "@/lib/f1";
import { teamColor } from "@/lib/teamColors";

function DriverRow({ s }: { s: DriverStanding }) {
  const team = s.Constructors[0];
  const color = team
    ? teamColor(team.constructorId, team.name)
    : "#9CA3AF";
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="w-6 text-right font-mono text-xs text-zinc-500">
        {s.position}
      </span>
      <span
        className="h-6 w-1 rounded-sm"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="flex-1 truncate">
        <span className="font-medium">
          {s.Driver.givenName} {s.Driver.familyName}
        </span>
        {team && (
          <span className="ml-2 text-xs text-zinc-500">{team.name}</span>
        )}
      </span>
      <span className="font-mono text-sm tabular-nums">{s.points}</span>
    </li>
  );
}

function ConstructorRow({ s }: { s: ConstructorStanding }) {
  const color = teamColor(s.Constructor.constructorId, s.Constructor.name);
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="w-6 text-right font-mono text-xs text-zinc-500">
        {s.position}
      </span>
      <span
        className="h-6 w-1 rounded-sm"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="flex-1 truncate font-medium">{s.Constructor.name}</span>
      <span className="font-mono text-sm tabular-nums">{s.points}</span>
    </li>
  );
}

export default async function Standings() {
  const [drivers, constructors] = await Promise.all([
    getDriverStandings(),
    getConstructorStandings(),
  ]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
          Driver Standings
        </h3>
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {drivers.slice(0, 10).map((s) => (
            <DriverRow key={s.Driver.driverId} s={s} />
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
          Constructor Standings
        </h3>
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {constructors.map((s) => (
            <ConstructorRow key={s.Constructor.constructorId} s={s} />
          ))}
        </ul>
      </section>
    </div>
  );
}
