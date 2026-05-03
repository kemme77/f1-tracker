import { Suspense } from "react";
import HeroTrack from "./components/HeroTrack";
import Podium from "./components/Podium";
import Standings from "./components/Standings";
import ScheduleTimeline from "./components/ScheduleTimeline";
import RaceSelector from "./components/RaceSelector";
import LiveTicker from "./components/LiveTicker";
import WinnerPrediction from "./components/WinnerPrediction";
import {
  getRaceWithResults,
  getSchedule,
  type Race,
} from "@/lib/f1";

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

  const isCurrent = selected.round === currentRace.round;
  const past = isPastRace(selected);

  // Last completed race (for podium when viewing current/future race)
  const lastCompleted = [...schedule]
    .reverse()
    .find((r) => isPastRace(r));

  // Pick which race's results to show in podium card.
  // - If selected is past, show selected.
  // - Else show last completed.
  const podiumRound = past
    ? selected.round
    : lastCompleted?.round ?? null;

  const podiumRacePromise = podiumRound
    ? getRaceWithResults(podiumRound)
    : Promise.resolve(null);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="text-f1">F1</span>
            <span>Tracker</span>
          </h1>
          <RaceSelector
            races={schedule.map((r) => ({
              round: r.round,
              raceName: r.raceName,
              date: r.date,
            }))}
            selectedRound={selected.round}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <Suspense fallback={<Skeleton className="h-[28rem]" />}>
          <HeroTrack race={selected} isCurrent={isCurrent} />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-32" />}>
          <ScheduleTimeline selectedRound={selected.round} />
        </Suspense>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Suspense fallback={<Skeleton className="h-56" />}>
            <PodiumWrap promise={podiumRacePromise} title={past ? "Result" : "Last Race"} />
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

      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        Built with Next.js · data via Jolpica F1 API · track outlines via
        bacinger/f1-circuits
      </footer>
    </div>
  );
}

async function PodiumWrap({
  promise,
  title,
}: {
  promise: Promise<Race | null>;
  title: string;
}) {
  const race = await promise;
  return <Podium race={race} title={title} />;
}
