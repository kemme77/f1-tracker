import { Suspense } from "react";
import HeroTrack from "./components/HeroTrack";
import RaceResults from "./components/RaceResults";
import Standings from "./components/Standings";
import ScheduleTimeline from "./components/ScheduleTimeline";
import RaceSelector from "./components/RaceSelector";
import LiveTicker from "./components/LiveTicker";
import StartingGrid from "./components/StartingGrid";
import WinnerPrediction from "./components/WinnerPrediction";
import {
  getRaceWithResults,
  getSchedule,
  type Race,
} from "@/lib/f1";
import { flagFor } from "@/lib/flags";

function Skeleton({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-border bg-surface-muted ${className}`}
    />
  );
}

function pickCurrentRace(races: Race[]): Race {
  const now = Date.now();
  const upcoming = races.find((r) => {
    const t = new Date(r.date).getTime();
    return Number.isFinite(t) && t + 86400000 >= now;
  });
  return upcoming ?? races[races.length - 1];
}

function isPastRace(r: Race): boolean {
  const t = new Date(r.date).getTime();
  return Number.isFinite(t) && t + 86400000 < Date.now();
}

type SearchParams = Promise<{ round?: string | string[] }>;

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { round } = await searchParams;
  const roundParam = Array.isArray(round) ? round[0] : round;

  const schedule = await getSchedule();
  const currentRace = pickCurrentRace(schedule);
  const selected =
    schedule.find((r) => r.round === roundParam) ?? currentRace;

  const isPast = isPastRace(selected);
  // Results of whichever race is currently selected.
  const resultsRacePromise = getRaceWithResults(selected.round);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="text-f1">F1</span>
            <span>Tracker</span>
            <span>-</span>
            <span>2026</span>
          </h1>
          <RaceSelector
            races={schedule.map((r) => ({
              round: r.round,
              raceName: r.raceName,
              date: r.date,
              country: r.Circuit.Location.country,
              flag: flagFor(r.Circuit.Location.country),
            }))}
            selectedRound={selected.round}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <Suspense fallback={<Skeleton className="h-112" />}>
          <HeroTrack race={selected} isPast={isPast} />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-32" />}>
          <ScheduleTimeline selectedRound={selected.round} />
        </Suspense>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
          <Suspense fallback={<Skeleton className="h-56" />}>
            <RaceResultsWrap promise={resultsRacePromise} />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-56" />}>
            <StartingGrid race={selected} />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-56" />}>
            <WinnerPrediction race={selected} />
          </Suspense>

          <LiveTicker />
        </section>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
          }
        >
          <Standings />
        </Suspense>
      </main>

      <footer className="space-y-1 border-t border-border px-6 py-6 text-center text-xs text-muted">
        <p>
          Built with Next.js · data via Jolpica F1 API · track outlines via
          bacinger/f1-circuits
        </p>
        <p>
          Unofficial fan project — not associated with Formula 1. F1, FORMULA 1,
          GRAND PRIX and related marks are trade marks of Formula One Licensing
          B.V.
        </p>
      </footer>
    </div>
  );
}

async function RaceResultsWrap({
  promise,
}: {
  promise: Promise<Race | null>;
}) {
  const race = await promise;
  return <RaceResults race={race} />;
}
