import type { Circuit } from "@/lib/f1";

type Props = { circuit: Circuit };

function bbox(lat: number, lon: number, span = 0.04): string {
  const minLon = lon - span;
  const maxLon = lon + span;
  const minLat = lat - span / 2;
  const maxLat = lat + span / 2;
  return `${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}`;
}

export default function TrackMap({ circuit }: Props) {
  const lat = parseFloat(circuit.Location.lat);
  const lon = parseFloat(circuit.Location.long);
  const valid = Number.isFinite(lat) && Number.isFinite(lon);

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

      <div className="mt-4 aspect-video overflow-hidden rounded-b-2xl bg-zinc-100 dark:bg-zinc-900">
        {valid ? (
          <iframe
            title={`Map of ${circuit.circuitName}`}
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox(lat, lon)}&layer=mapnik&marker=${lat}%2C${lon}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            No location data.
          </div>
        )}
      </div>

      <div className="px-5 py-3 text-xs text-zinc-500">
        <a
          className="hover:underline"
          target="_blank"
          rel="noreferrer"
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`}
        >
          Open in OpenStreetMap →
        </a>
      </div>
    </div>
  );
}
