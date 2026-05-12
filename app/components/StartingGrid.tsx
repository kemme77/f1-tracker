import { getRaceGrid, type Race, type QualifyingEntry } from "@/lib/f1";
import ResultsPanel from "./ResultsPanel";
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
    <ResultsPanel
      title="Starting Grid"
      subtitle={race.raceName}
      empty={grid.length === 0 ? "Grid not available yet for this race." : undefined}
    >
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
    </ResultsPanel>
  );
}
