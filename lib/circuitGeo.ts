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
  sectors: [string, string, string];
  start: { x: number; y: number };
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
const PADDING = 32;

function pickTrackFeature(fc: FeatureCollection): Feature | null {
  const lineFeatures = fc.features.filter(
    (f) => f.geometry?.type === "LineString",
  );
  if (lineFeatures.length === 0) return null;
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

function cumulativeDist(points: [number, number][]): number[] {
  const out: number[] = new Array(points.length);
  out[0] = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    out[i] = out[i - 1] + Math.hypot(dx, dy);
  }
  return out;
}

function pathFromPoints(points: [number, number][]): string {
  if (points.length === 0) return "";
  const parts: string[] = [];
  points.forEach(([x, y], i) => {
    parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  });
  return parts.join(" ");
}

function buildPath(coords: [number, number][]): TrackPath {
  const [minLon, minLat, maxLon, maxLat] = bboxOf(coords);
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

  const projected: [number, number][] = coords.map(([lon, lat]) => [
    offsetX + (lon - minLon) * lonScale * scale,
    offsetY + (maxLat - lat) * scale,
  ]);

  // Cumulative distance along projected line for sector splits.
  const cum = cumulativeDist(projected);
  const total = cum[cum.length - 1];

  let split1 = 0,
    split2 = 0;
  for (let i = 0; i < cum.length; i++) {
    if (cum[i] <= total / 3) split1 = i;
    if (cum[i] <= (2 * total) / 3) split2 = i;
  }

  // Each sector overlaps the boundary point with the next so the line
  // visually connects.
  const seg1 = projected.slice(0, split1 + 1);
  const seg2 = projected.slice(split1, split2 + 1);
  const seg3 = projected.slice(split2);

  // Close the loop in sector 3 by appending the first point.
  if (seg3.length > 0 && projected.length > 0) {
    seg3.push(projected[0]);
  }

  return {
    sectors: [pathFromPoints(seg1), pathFromPoints(seg2), pathFromPoints(seg3)],
    start: { x: projected[0][0], y: projected[0][1] },
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
