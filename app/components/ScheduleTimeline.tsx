import Link from "next/link";
import { getSchedule, type Race } from "@/lib/f1";

const COUNTRY_FLAGS: Record<string, string> = {
  Australia: "🇦🇺",
  China: "🇨🇳",
  Japan: "🇯🇵",
  Bahrain: "🇧🇭",
  "Saudi Arabia": "🇸🇦",
  USA: "🇺🇸",
  "United States": "🇺🇸",
  Italy: "🇮🇹",
  Monaco: "🇲🇨",
  Spain: "🇪🇸",
  Canada: "🇨🇦",
  Austria: "🇦🇹",
  UK: "🇬🇧",
  "United Kingdom": "🇬🇧",
  Belgium: "🇧🇪",
  Hungary: "🇭🇺",
  Netherlands: "🇳🇱",
  Azerbaijan: "🇦🇿",
  Singapore: "🇸🇬",
  Mexico: "🇲🇽",
  Brazil: "🇧🇷",
  Qatar: "🇶🇦",
  UAE: "🇦🇪",
  France: "🇫🇷",
  Germany: "🇩🇪",
  Portugal: "🇵🇹",
  Turkey: "🇹🇷",
  Malaysia: "🇲🇾",
  Russia: "🇷🇺",
};

function shortDate(dateISO: string): string {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return dateISO;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

function isPast(race: Race): boolean {
  const d = new Date(race.date);
  return Number.isFinite(d.getTime()) && d.getTime() < Date.now() - 86400000;
}

export default async function ScheduleTimeline({
  selectedRound,
}: {
  selectedRound: string;
}) {
  const races = await getSchedule();

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted">
          Schedule
        </h3>
        <span className="text-xs text-muted">
          {races.length} races · {races[0]?.season}
        </span>
      </div>

      <ol className="flex gap-2 overflow-x-auto pb-2">
        {races.map((r) => {
          const past = isPast(r);
          const selected = r.round === selectedRound;
          const flag =
            COUNTRY_FLAGS[r.Circuit.Location.country] ?? "🏁";
          return (
            <li key={r.round} className="shrink-0">
              <Link
                href={`/?round=${r.round}`}
                aria-current={selected ? "page" : undefined}
                className={[
                  "flex w-32 flex-col gap-0.5 rounded-xl border px-3 py-2 transition",
                  selected
                    ? "border-f1 bg-f1/10"
                    : "border-border hover:border-muted",
                  past && !selected ? "opacity-50" : "",
                ].join(" ")}
              >
                <span className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted">
                  <span>R{r.round}</span>
                  <span className="text-base leading-none">{flag}</span>
                </span>
                <span className="truncate text-sm font-semibold">
                  {r.Circuit.Location.country}
                </span>
                <span className="truncate text-xs text-muted">
                  {shortDate(r.date)}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
