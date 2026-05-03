"use client";

import { useRouter } from "next/navigation";

type Option = {
  round: string;
  raceName: string;
  date: string;
  country: string;
  flag: string;
};

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
          {r.flag} R{r.round} — {r.raceName}
        </option>
      ))}
    </select>
  );
}
