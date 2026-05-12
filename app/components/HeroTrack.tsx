import type { Race } from "@/lib/f1";
import { raceStartUTC } from "@/lib/f1";
import { getTrackPath } from "@/lib/circuitGeo";
import { getCircuitOverlay } from "@/lib/multiviewer";
import TrackMap from "./TrackMap";
import CountdownRefresher from "./CountdownRefresher";
import Sessions from "./Sessions";

type Props = { race: Race; isPast: boolean };

export default async function HeroTrack({ race, isPast }: Props) {
  const path = await getTrackPath(race.Circuit.circuitId);
  const overlay = path
    ? await getCircuitOverlay(race.Circuit.circuitId, path.coordinates)
    : { turns: [], sfIdx: 0 };
  const startISO = raceStartUTC(race)?.toISOString() ?? null;

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
      <div className="grid grid-cols-1 gap-0 lg:grid-cols-12">
        {/* Race info column */}
        <div className="border-b border-border p-6 lg:col-span-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
            <span>Round {race.round}</span>
            <span aria-hidden>·</span>
            <span>{race.season}</span>
            {isPast && (
              <span className="ml-1 rounded-full border border-border px-2 py-0.5 text-[10px] tracking-wider text-muted">
                past
              </span>
            )}
          </div>
          <h2 className="mt-1 text-2xl font-bold leading-tight tracking-tight">
            {race.raceName}
          </h2>
          <p className="text-sm text-muted">{race.Circuit.circuitName}</p>
          <p className="text-xs text-muted">
            {race.Circuit.Location.locality}, {race.Circuit.Location.country}
          </p>

          {!isPast && startISO && (
            <div className="mt-4 rounded-xl border border-f1/20 bg-f1/5 px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-f1">
                Lights out in
              </p>
              <p className="font-mono text-lg font-semibold text-f1">
                <CountdownRefresher round={race.round} initialISO={startISO} />
              </p>
            </div>
          )}

          <div className="mt-4">
            <Sessions race={race} />
          </div>
        </div>

        {/* Track column */}
        <div className="flex flex-col lg:col-span-7">
          <div className="aspect-video w-full bg-surface-muted lg:aspect-auto lg:flex-1">
            {path ? (
              <TrackMap
                coordinates={overlay.coordinates ?? path.coordinates}
                sfIdx={overlay.sfIdx}
                turns={overlay.turns}
                s1Idx={overlay.s1Idx}
                s2Idx={overlay.s2Idx}
                label={`Satellite view of ${race.Circuit.circuitName}`}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                No track outline available for this circuit.
              </div>
            )}
          </div>
        </div>
      </div>

    </section>
  );
}
