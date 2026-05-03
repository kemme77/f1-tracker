import { getNextRace, raceStartUTC, type Race } from "@/lib/f1";
import Countdown from "./Countdown";
import LocalTime from "./LocalTime";

function buildISO(date?: string, time?: string): string | null {
  if (!date) return null;
  return time
    ? `${date}T${time.replace(/Z?$/, "Z")}`
    : `${date}T00:00:00Z`;
}

function Slot({
  label,
  date,
  time,
}: {
  label: string;
  date?: string;
  time?: string;
}) {
  const iso = buildISO(date, time);
  if (!iso) return null;
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 py-2 last:border-b-0 dark:border-zinc-800">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm">
        <LocalTime iso={iso} />
      </span>
    </div>
  );
}

export default async function NextRaceCard() {
  const race: Race | null = await getNextRace();

  if (!race) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-zinc-500">No upcoming race found.</p>
      </div>
    );
  }

  const startUTC = raceStartUTC(race);
  const startISO = startUTC?.toISOString() ?? null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Round {race.round} · {race.season}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            {race.raceName}
          </h2>
          <p className="text-sm text-zinc-500">
            {race.Circuit.circuitName} — {race.Circuit.Location.locality},{" "}
            {race.Circuit.Location.country}
          </p>
        </div>
        {startISO && (
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              Lights out in
            </p>
            <p className="mt-1 text-lg font-semibold text-red-600 dark:text-red-400">
              <Countdown targetISO={startISO} />
            </p>
          </div>
        )}
      </div>

      <div className="mt-5">
        <Slot
          label="FP1"
          date={race.FirstPractice?.date}
          time={race.FirstPractice?.time}
        />
        <Slot
          label="FP2"
          date={race.SecondPractice?.date}
          time={race.SecondPractice?.time}
        />
        <Slot
          label="FP3"
          date={race.ThirdPractice?.date}
          time={race.ThirdPractice?.time}
        />
        <Slot
          label="Sprint Quali"
          date={race.SprintQualifying?.date}
          time={race.SprintQualifying?.time}
        />
        <Slot
          label="Sprint"
          date={race.Sprint?.date}
          time={race.Sprint?.time}
        />
        <Slot
          label="Qualifying"
          date={race.Qualifying?.date}
          time={race.Qualifying?.time}
        />
        <Slot label="Race" date={race.date} time={race.time} />
      </div>
    </div>
  );
}
