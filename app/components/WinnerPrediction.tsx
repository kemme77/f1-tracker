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

  const currentDriverMeta = new Map(
    standings.map((row) => [row.Driver.driverId, row]),
  );

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
    const currentRow = currentDriverMeta.get(r.Driver.driverId);
    if (!currentRow) return;

    const recencyMult = 1 - idx * 0.1; // recent first
    const bonus = Math.max(2, Math.round(HISTORY_WEIGHT * recencyMult));
    const team = currentRow.Constructors[0];
    const s = ensure(
      r.Driver.driverId,
      `${r.Driver.givenName} ${r.Driver.familyName}`,
      team?.name ?? "—",
      team?.constructorId ?? "",
    );
    s.points += bonus;
    s.reasons.push(`Won here ${winnerRace.season} (+${bonus})`);
  });

  const ranked = [...scores.values()]
    .filter((s) => s.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  const LABELS = ["Favorite", "2nd pick", "3rd pick"];
  const LABEL_COLORS = ["text-f1", "text-muted", "text-muted"];

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="text-sm font-medium uppercase tracking-wider text-muted">
        Winner Prediction
      </h3>
      <p className="text-xs text-muted">
        Heuristic: standings + history at {race.Circuit.circuitName}
      </p>

      {ranked.length > 0 ? (
        <ol className="mt-4 space-y-2">
          {ranked.map((p, i) => (
            <li
              key={p.driverId}
              className="rounded-xl border border-border p-3"
              style={{
                borderLeft: `4px solid ${teamColor(p.teamId, p.team)}`,
              }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p
                  className={`text-[10px] font-mono uppercase tracking-widest ${LABEL_COLORS[i]}`}
                >
                  {LABELS[i]}
                </p>
                <p className="font-mono text-xs text-muted">
                  score: {p.points}
                </p>
              </div>
              <p className="mt-0.5 font-semibold">{p.name}</p>
              <p className="text-xs text-muted">{p.team}</p>
              {i === 0 && p.reasons.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-[11px] text-muted">
                  {p.reasons.slice(0, 3).map((r, k) => (
                    <li key={k}>· {r}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
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
