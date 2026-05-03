import type { Circuit } from "@/lib/f1";
import { getTrackPath } from "@/lib/circuitGeo";

type Props = { circuit: Circuit };

function bbox(lat: number, lon: number, span = 0.04): string {
  const minLon = lon - span;
  const maxLon = lon + span;
  const minLat = lat - span / 2;
  const maxLat = lat + span / 2;
  return `${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}`;
}

function FallbackOSM({ circuit }: Props) {
  const lat = parseFloat(circuit.Location.lat);
  const lon = parseFloat(circuit.Location.long);
  const valid = Number.isFinite(lat) && Number.isFinite(lon);
  if (!valid) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        No location data.
      </div>
    );
  }
  return (
    <iframe
      title={`Map of ${circuit.circuitName}`}
      className="h-full w-full"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox(lat, lon)}&layer=mapnik&marker=${lat}%2C${lon}`}
    />
  );
}

export default async function TrackMap({ circuit }: Props) {
  const path = await getTrackPath(circuit.circuitId);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="px-5 pt-5">
        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          Track
        </h3>
        <p className="mt-1 text-xl font-semibold">{circuit.circuitName}</p>
        <p className="text-sm text-zinc-500">
          {circuit.Location.locality}, {circuit.Location.country}
        </p>
      </div>

      <div className="mt-4 aspect-video overflow-hidden bg-zinc-50 dark:bg-zinc-900">
        {path ? (
          <svg
            viewBox={path.viewBox}
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-full"
            role="img"
            aria-label={`Outline of ${circuit.circuitName}`}
          >
            <path
              d={path.d}
              fill="none"
              stroke="currentColor"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-600 dark:text-red-500"
            />
          </svg>
        ) : (
          <FallbackOSM circuit={circuit} />
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-3 text-xs text-zinc-500">
        {path?.meta.length ? (
          <span>
            Length:{" "}
            <span className="font-mono text-zinc-700 dark:text-zinc-300">
              {(path.meta.length / 1000).toFixed(3)} km
            </span>
            {path.meta.firstGp ? (
              <span className="ml-3">
                First GP:{" "}
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  {path.meta.firstGp}
                </span>
              </span>
            ) : null}
          </span>
        ) : (
          <span>Outline via bacinger/f1-circuits</span>
        )}
        <a
          className="hover:underline"
          target="_blank"
          rel="noreferrer"
          href={`https://www.openstreetmap.org/?mlat=${circuit.Location.lat}&mlon=${circuit.Location.long}#map=15/${circuit.Location.lat}/${circuit.Location.long}`}
        >
          OSM →
        </a>
      </div>
    </div>
  );
}
