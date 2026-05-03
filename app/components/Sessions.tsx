import LocalTime from "./LocalTime";
import type { Race } from "@/lib/f1";

function buildISO(date?: string, time?: string): string | null {
  if (!date) return null;
  return time
    ? `${date}T${time.replace(/Z?$/, "Z")}`
    : `${date}T00:00:00Z`;
}

type Slot = { label: string; iso: string | null };

function collectSlots(race: Race): Slot[] {
  return [
    { label: "FP1", iso: buildISO(race.FirstPractice?.date, race.FirstPractice?.time) },
    { label: "FP2", iso: buildISO(race.SecondPractice?.date, race.SecondPractice?.time) },
    { label: "FP3", iso: buildISO(race.ThirdPractice?.date, race.ThirdPractice?.time) },
    { label: "Sprint Quali", iso: buildISO(race.SprintQualifying?.date, race.SprintQualifying?.time) },
    { label: "Sprint", iso: buildISO(race.Sprint?.date, race.Sprint?.time) },
    { label: "Qualifying", iso: buildISO(race.Qualifying?.date, race.Qualifying?.time) },
    { label: "Race", iso: buildISO(race.date, race.time) },
  ].filter((s) => s.iso !== null);
}

export default function Sessions({ race }: { race: Race }) {
  const slots = collectSlots(race);
  return (
    <ul className="divide-y divide-border">
      {slots.map((s) => (
        <li
          key={s.label}
          className="flex items-center justify-between py-2 text-sm"
        >
          <span className="text-muted">{s.label}</span>
          <span>
            <LocalTime iso={s.iso!} />
          </span>
        </li>
      ))}
    </ul>
  );
}
