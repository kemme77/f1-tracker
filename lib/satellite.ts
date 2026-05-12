// Esri "World Imagery" exposes a metadata layer alongside the basemap tiles.
// Querying `identify` at a point tells us when that imagery was captured, its
// source and its resolution — handy for transparency, since the tiles can be a
// couple of years old and for brand-new circuits will predate construction.

const IDENTIFY =
  "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/identify";

export type SatelliteInfo = {
  date?: string; // human label, e.g. "Jun 2025"
  year?: number;
  source?: string; // imagery provider, e.g. "Vantor" (ex-Maxar)
  resolutionM?: number; // ground sample distance in metres
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function parseYmd(s: string | undefined): { year: number; label: string } | null {
  const m = s && /^(\d{4})(\d{2})(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = MONTHS[Number(m[2]) - 1];
  return { year, label: month ? `${month} ${year}` : String(year) };
}

type IdentifyResult = { layerId?: number; attributes?: Record<string, string> };

// `bbox` is [minLon, minLat, maxLon, maxLat] of the track outline — used as the
// query point (its centre) and the map extent so Esri returns the same imagery
// tier the track map renders at.
export async function getSatelliteInfo(
  bbox: [number, number, number, number],
): Promise<SatelliteInfo | null> {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  if (![minLon, minLat, maxLon, maxLat].every(Number.isFinite)) return null;

  const params = new URLSearchParams({
    f: "json",
    geometry: JSON.stringify({
      x: (minLon + maxLon) / 2,
      y: (minLat + maxLat) / 2,
      spatialReference: { wkid: 4326 },
    }),
    geometryType: "esriGeometryPoint",
    sr: "4326",
    mapExtent: JSON.stringify({
      xmin: minLon,
      ymin: minLat,
      xmax: maxLon,
      ymax: maxLat,
      spatialReference: { wkid: 4326 },
    }),
    imageDisplay: "800,500,96",
    tolerance: "1",
    returnGeometry: "false",
    layers: "all",
  });

  try {
    const res = await fetch(`${IDENTIFY}?${params.toString()}`, {
      next: { revalidate: 60 * 60 * 24 * 14 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: IdentifyResult[] };
    const results = Array.isArray(data.results) ? data.results : [];
    const pick =
      results.find((r) => r.layerId === 0 && r.attributes?.["DATE (YYYYMMDD)"]) ??
      results.find((r) => r.attributes?.["DATE (YYYYMMDD)"]);
    const a = pick?.attributes;
    if (!a) return null;

    const d = parseYmd(a["DATE (YYYYMMDD)"]);
    const resM = Number(a["RESOLUTION (M)"]);
    return {
      date: d?.label,
      year: d?.year,
      source: a["SOURCE"]?.trim() || undefined,
      resolutionM: Number.isFinite(resM) && resM > 0 ? resM : undefined,
    };
  } catch {
    return null;
  }
}
