"use client";

import { useRouter } from "next/navigation";
import type { Race } from "@/lib/f1";

type Option = Pick<Race, "round" | "raceName" | "date">;

type Props = {
  races: Option[];
  selectedRound: string;
};

export default function RaceSelector({ races, selectedRound }: Props) {
  const router = useRouter();

  return (
    <select
      aria-label="Select race"
      value={selectedRound}
      onChange={(e) => {
        const round = e.target.value;
        router.push(`/?round=${round}`);
      }}
      className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:border-muted focus:outline-none focus:ring-2 focus:ring-f1/40"
    >
      {races.map((r) => (
        <option key={r.round} value={r.round}>
          R{r.round} — {r.raceName}
        </option>
      ))}
    </select>
  );
}
