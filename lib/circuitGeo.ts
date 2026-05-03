import { bacingerFile } from "./circuitMap";

const BASE =
  "https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits";

type LineString = {
  type: "LineString";
  coordinates: [number, number][];
};

type Feature = {
  type: "Feature";
  properties: Record<string, unknown>;
  bbox?: [number, number, number, number];
  geometry: LineString | { type: string; coordinates: unknown };
};

type FeatureCollection = {
  type: "FeatureCollection";
  bbox?: [number, number, number, number];
  features: Feature[];
};

export type TrackPath = {
  d: string;
  viewBox: string;
  meta: {
    name?: string;
    location?: string;
    length?: number;
    firstGp?: number;
  };
};

const VIEW_W = 1000;
const VIEW_H = 600;
const PADDING = 24;

function pickTrackFeature(fc: FeatureCollection): Feature | null {
  const lineFeatures = fc.features.filter(
    (f) => f.geometry?.type === "LineString",
  );
  if (lineFeatures.length === 0) return null;
  // Pick longest LineString as the racing line.
  return lineFeatures.reduce((best, f) => {
    const a = (f.geometry as LineString).coordinates.length;
    const b = (best.geometry as LineString).coordinates.length;
    return a > b ? f : best;
  });
}

function bboxOf(coords: [number, number][]): [number, number, number, number] {
  let minLon = Infinity,
    maxLon = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;
  for (const [lon, lat] of coords) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return [minLon, minLat, maxLon, maxLat];
}

function buildPath(coords: [number, number][]): TrackPath {
  const [minLon, minLat, maxLon, maxLat] = bboxOf(coords);

  // Equirectangular-ish projection: account for latitude squash so the
  // track does not look stretched east/west.
  const midLat = (minLat + maxLat) / 2;
  const lonScale = Math.cos((midLat * Math.PI) / 180);

  const rawW = (maxLon - minLon) * lonScale;
  const rawH = maxLat - minLat;

  const innerW = VIEW_W - PADDING * 2;
  const innerH = VIEW_H - PADDING * 2;
  const scale = Math.min(innerW / rawW, innerH / rawH);

  const projW = rawW * scale;
  const projH = rawH * scale;
  const offsetX = (VIEW_W - projW) / 2;
  const offsetY = (VIEW_H - projH) / 2;

  const project = (lon: number, lat: number): [number, number] => {
    const x = offsetX + (lon - minLon) * lonScale * scale;
    // flip Y so north is up
    const y = offsetY + (maxLat - lat) * scale;
    return [x, y];
  };

  const parts: string[] = [];
  coords.forEach(([lon, lat], i) => {
    const [x, y] = project(lon, lat);
    parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  });
  parts.push("Z");

  return {
    d: parts.join(" "),
    viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
    meta: {},
  };
}

export async function getTrackPath(
  circuitId: string,
): Promise<TrackPath | null> {
  const file = bacingerFile(circuitId);
  if (!file) return null;

  const url = `${BASE}/${file}.geojson`;
  const res = await fetch(url, {
    next: { revalidate: 60 * 60 * 24 * 7 },
  });
  if (!res.ok) return null;

  let fc: FeatureCollection;
  try {
    fc = (await res.json()) as FeatureCollection;
  } catch {
    return null;
  }

  const feature = pickTrackFeature(fc);
  if (!feature) return null;

  const coords = (feature.geometry as LineString).coordinates;
  if (!coords || coords.length < 2) return null;

  const path = buildPath(coords);
  const props = feature.properties as Record<string, unknown>;
  path.meta = {
    name: typeof props.Name === "string" ? props.Name : undefined,
    location: typeof props.Location === "string" ? props.Location : undefined,
    length:
      typeof props.length === "number" ? (props.length as number) : undefined,
    firstGp:
      typeof props.firstgp === "number" ? (props.firstgp as number) : undefined,
  };
  return path;
}
