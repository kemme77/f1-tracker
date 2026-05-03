import {
  getCircuitWinners,
  getDriverStandings,
  type DriverStanding,
  type Race,
} from "@/lib/f1";
import { teamColor } from "@/lib/teamColors";

type Props = { race: Race };

type DriverScore = {
  driverId: string;
  name: string;
  team: string;
  teamId: string;
  points: number;
  reasons: string[];
};

const STANDINGS_WEIGHT = 4; // 4 pts × position bonus
const HISTORY_WEIGHT = 6; // 6 pts per past win at this circuit

function topDrivers(
  standings: DriverStanding[],
  n: number,
): DriverStanding[] {
  return standings.slice(0, n);
}

export default async function WinnerPrediction({ race }: Props) {
  const [standings, circuitWinners] = await Promise.all([
    getDriverStandings(),
    getCircuitWinners(race.Circuit.circuitId).catch(() => [] as Race[]),
  ]);

  const scores = new Map<string, DriverScore>();
  function ensure(
    id: string,
    name: string,
    team: string,
    teamId: string,
  ): DriverScore {
    let s = scores.get(id);
    if (!s) {
      s = { driverId: id, name, team, teamId, points: 0, reasons: [] };
      scores.set(id, s);
    }
    return s;
  }

  // Heuristic 1: standings position bonus for top 5
  topDrivers(standings, 5).forEach((row, i) => {
    const team = row.Constructors[0];
    const s = ensure(
      row.Driver.driverId,
      `${row.Driver.givenName} ${row.Driver.familyName}`,
      team?.name ?? "—",
      team?.constructorId ?? "",
    );
    const bonus = STANDINGS_WEIGHT * (5 - i);
    s.points += bonus;
    s.reasons.push(`P${row.position} in standings (+${bonus})`);
  });

  // Heuristic 2: past winners at this circuit (recent races weighted more)
  circuitWinners.slice(0, 8).forEach((winnerRace, idx) => {
    const r = winnerRace.Results?.[0];
    if (!r) return;
    const recencyMult = 1 - idx * 0.1; // recent first
    const bonus = Math.max(2, Math.round(HISTORY_WEIGHT * recencyMult));
    const team = r.Constructor;
    const s = ensure(
      r.Driver.driverId,
      `${r.Driver.givenName} ${r.Driver.familyName}`,
      team.name,
      team.constructorId,
    );
    s.points += bonus;
    s.reasons.push(`Won here ${winnerRace.season} (+${bonus})`);
  });

  const ranked = [...scores.values()]
    .filter((s) => s.points > 0)
    .sort((a, b) => b.points - a.points);

  const favorite = ranked[0] ?? null;
  const dark = ranked[1] ?? null;

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted">
        Winner Prediction
      </h3>
      <p className="text-xs text-muted">
        Heuristic: standings + history at {race.Circuit.circuitName}
      </p>

      {favorite ? (
        <div className="mt-4">
          <div
            className="rounded-xl border border-border p-3"
            style={{
              borderLeft: `4px solid ${teamColor(favorite.teamId, favorite.team)}`,
            }}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-f1">
              Favorite
            </p>
            <p className="font-semibold">{favorite.name}</p>
            <p className="text-xs text-muted">{favorite.team}</p>
            <p className="mt-1 font-mono text-xs">
              score: {favorite.points}
            </p>
            <ul className="mt-2 space-y-0.5 text-[11px] text-muted">
              {favorite.reasons.slice(0, 3).map((r, i) => (
                <li key={i}>· {r}</li>
              ))}
            </ul>
          </div>

          {dark && (
            <div
              className="mt-3 rounded-xl border border-border p-3"
              style={{
                borderLeft: `4px solid ${teamColor(dark.teamId, dark.team)}`,
              }}
            >
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
                Dark horse
              </p>
              <p className="font-semibold">{dark.name}</p>
              <p className="text-xs text-muted">{dark.team}</p>
              <p className="mt-1 font-mono text-xs">score: {dark.points}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Not enough data to predict.
        </p>
      )}

      <p className="mt-4 text-[10px] italic text-muted">
        For fun — not betting advice.
      </p>
    </section>
  );
}
