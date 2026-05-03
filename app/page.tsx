import { Suspense } from "react";
import NextRaceCard from "./components/NextRaceCard";
import TrackMap from "./components/TrackMap";
import Standings from "./components/Standings";
import Podium from "./components/Podium";
import { getNextRace } from "@/lib/f1";

function CardSkeleton({ height = "h-48" }: { height?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 ${height} dark:border-zinc-800 dark:bg-zinc-900`}
    />
  );
}

async function TrackMapAsync() {
  const race = await getNextRace();
  if (!race) return null;
  return <TrackMap circuit={race.Circuit} />;
}

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-black/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-red-600">F1</span> Tracker
          </h1>
          <span className="text-xs text-zinc-500">
            data: jolpi.ca · refresh 5min
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Suspense fallback={<CardSkeleton height="h-96" />}>
            <NextRaceCard />
          </Suspense>
          <Suspense fallback={<CardSkeleton height="h-96" />}>
            <TrackMapAsync />
          </Suspense>
        </section>

        <Suspense fallback={<CardSkeleton height="h-40" />}>
          <Podium />
        </Suspense>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <CardSkeleton height="h-96" />
              <CardSkeleton height="h-96" />
            </div>
          }
        >
          <Standings />
        </Suspense>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
        Built with Next.js · data via Jolpica F1 API · maps © OpenStreetMap
      </footer>
    </div>
  );
}
