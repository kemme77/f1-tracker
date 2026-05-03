import type { Race } from "@/lib/f1";
import { raceStartUTC } from "@/lib/f1";
import { getTrackPath } from "@/lib/circuitGeo";
import TrackSVG from "./TrackSVG";
import Countdown from "./Countdown";
import Sessions from "./Sessions";

type Props = { race: Race; isCurrent: boolean };

export default async function HeroTrack({ race, isCurrent }: Props) {
  const path = await getTrackPath(race.Circuit.circuitId);
  const startISO = raceStartUTC(race)?.toISOString() ?? null;

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
      <div className="relative">
        <div className="aspect-[21/9] w-full bg-surface-muted">
          {path ? (
            <TrackSVG
              path={path}
              ariaLabel={`Outline of ${race.Circuit.circuitName}`}
              strokeWidth={8}
              showSectorLabels
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              No track outline available for this circuit.
            </div>
          )}
        </div>

        {/* Race-info overlay */}
        <div className="pointer-events-none absolute right-4 top-4 max-w-[22rem] rounded-2xl border border-border bg-surface/85 p-5 shadow-lg backdrop-blur md:right-6 md:top-6">
          <div className="pointer-events-auto">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
              <span>Round {race.round}</span>
              <span aria-hidden>·</span>
              <span>{race.season}</span>
              {!isCurrent && (
                <span className="ml-1 rounded-full border border-border px-2 py-0.5 text-[10px] tracking-wider text-muted">
                  past
                </span>
              )}
            </div>
            <h2 className="mt-1 text-2xl font-bold leading-tight tracking-tight">
              {race.raceName}
            </h2>
            <p className="text-sm text-muted">
              {race.Circuit.circuitName}
            </p>
            <p className="text-xs text-muted">
              {race.Circuit.Location.locality},{" "}
              {race.Circuit.Location.country}
            </p>

            {isCurrent && startISO && (
              <div className="mt-4 rounded-xl border border-f1/20 bg-f1/5 px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-f1">
                  Lights out in
                </p>
                <p className="font-mono text-lg font-semibold text-f1">
                  <Countdown targetISO={startISO} />
                </p>
              </div>
            )}

            <div className="mt-4 hidden md:block">
              <Sessions race={race} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom info strip */}
      {path?.meta && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border px-5 py-3 text-xs text-muted">
          {path.meta.length && (
            <span>
              Length:{" "}
              <span className="font-mono text-foreground">
                {(path.meta.length / 1000).toFixed(3)} km
              </span>
            </span>
          )}
          {path.meta.firstGp && (
            <span>
              First GP:{" "}
              <span className="font-mono text-foreground">
                {path.meta.firstGp}
              </span>
            </span>
          )}
          <span className="ml-auto">
            <a
              className="hover:underline"
              target="_blank"
              rel="noreferrer"
              href={`https://www.openstreetmap.org/?mlat=${race.Circuit.Location.lat}&mlon=${race.Circuit.Location.long}#map=15/${race.Circuit.Location.lat}/${race.Circuit.Location.long}`}
            >
              View on OpenStreetMap →
            </a>
          </span>
        </div>
      )}

      {/* Mobile sessions (overlay hides on small screens) */}
      <div className="border-t border-border px-5 py-3 md:hidden">
        <Sessions race={race} />
      </div>
    </section>
  );
}
