// OpenF1 — derive the two FIA timing-sector boundary positions for a circuit
// from a real lap.
//
// /sessions?circuit_key=K  → all sessions ever held at that circuit
// /laps?session_key=S      → each lap's start time + its three sector durations
// /location?...            → the car's (x, y) over time in the F1 positioning
//                            grid — the SAME grid MultiViewer uses
//
// Sector 1 ends at lapStart + duration_sector_1; sector 2 ends one more
// duration_sector_2 later. We pick a clean fast lap, interpolate the car's
// position at those two instants, and hand the points back in F1-grid
// coordinates. multiviewer.ts pushes them through its MV→bacinger transform to
// land them on the rendered outline. Because these are the *actual* split
// times from live timing, this replaces the hand-picked corner-number guesses
// in lib/sectors.ts (kept only as a fallback).
//
// OpenF1 has data from 2023 onwards. For circuits with no usable session the
// caller falls back to SECTOR_END_TURNS.

const BASE = "https://api.openf1.org/v1";
const REVALIDATE = { next: { revalidate: 60 * 60 * 24 * 30 } } as const;

type Vec2 = [number, number];

type Session = {
  session_key: number;
  session_type: string;
  session_name: string;
  date_start: string;
  year: number;
};

type Lap = {
  driver_number: number;
  lap_number: number;
  date_start: string | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  lap_duration: number | null;
  is_pit_out_lap: boolean;
};

type Loc = { date: string; x: number; y: number };

async function getJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, REVALIDATE);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Past sessions only, freshest first, races preferred over practice/quali.
function rankSessions(sessions: Session[]): Session[] {
  if (!Array.isArray(sessions)) return [];
  const now = Date.now();
  return sessions
    .filter((s) => s && s.session_key && s.date_start)
    .map((s) => ({ s, t: Date.parse(s.date_start) }))
    .filter(({ t }) => Number.isFinite(t) && t < now)
    .sort((a, b) => {
      const ra = a.s.session_type === "Race" ? 1 : 0;
      const rb = b.s.session_type === "Race" ? 1 : 0;
      return rb - ra || b.t - a.t;
    })
    .map(({ s }) => s);
}

function isCleanLap(l: Lap): boolean {
  return (
    !!l &&
    typeof l.date_start === "string" &&
    !l.is_pit_out_lap &&
    typeof l.duration_sector_1 === "number" &&
    typeof l.duration_sector_2 === "number" &&
    typeof l.duration_sector_3 === "number" &&
    typeof l.lap_duration === "number" &&
    l.lap_duration > 30 &&
    l.lap_duration < 600
  );
}

function interpAt(times: number[], samples: Loc[], targetMs: number): Vec2 | null {
  const n = times.length;
  if (n < 2 || targetMs < times[0] || targetMs > times[n - 1]) return null;
  for (let i = 0; i < n - 1; i++) {
    if (targetMs >= times[i] && targetMs <= times[i + 1]) {
      const span = times[i + 1] - times[i];
      const f = span > 0 ? (targetMs - times[i]) / span : 0;
      return [
        samples[i].x + f * (samples[i + 1].x - samples[i].x),
        samples[i].y + f * (samples[i + 1].y - samples[i].y),
      ];
    }
  }
  return null;
}

function isFiniteVec(v: Vec2): boolean {
  return Number.isFinite(v[0]) && Number.isFinite(v[1]) && !(v[0] === 0 && v[1] === 0);
}

async function sectorPointsForSession(sessionKey: number): Promise<SectorPoints | null> {
  const laps = await getJSON<Lap[]>(`${BASE}/laps?session_key=${sessionKey}`);
  if (!Array.isArray(laps)) return null;
  const clean = laps.filter(isCleanLap);
  if (clean.length === 0) return null;
  // Fastest clean lap → crisp split timing, car on the racing line.
  clean.sort((a, b) => (a.lap_duration as number) - (b.lap_duration as number));
  const lap = clean[0];

  const startMs = Date.parse(lap.date_start as string);
  if (!Number.isFinite(startMs)) return null;
  const s1Ms = startMs + (lap.duration_sector_1 as number) * 1000;
  const s2Ms = s1Ms + (lap.duration_sector_2 as number) * 1000;
  const endMs = s2Ms + (lap.duration_sector_3 as number) * 1000;

  const fromISO = new Date(startMs - 2000).toISOString();
  const toISO = new Date(endMs + 2000).toISOString();
  const locUrl =
    `${BASE}/location?session_key=${sessionKey}&driver_number=${lap.driver_number}` +
    `&date%3E${encodeURIComponent(fromISO)}&date%3C${encodeURIComponent(toISO)}`;
  const locs = await getJSON<Loc[]>(locUrl);
  if (!Array.isArray(locs)) return null;

  const samples = locs
    .filter(
      (p) =>
        p &&
        typeof p.date === "string" &&
        Number.isFinite(p.x) &&
        Number.isFinite(p.y) &&
        !(p.x === 0 && p.y === 0), // OpenF1 emits (0,0,0) for feed gaps
    )
    .map((p) => ({ p, t: Date.parse(p.date) }))
    .filter(({ t }) => Number.isFinite(t))
    .sort((a, b) => a.t - b.t);
  if (samples.length < 2) return null;

  const times = samples.map((x) => x.t);
  const pts = samples.map((x) => x.p);
  const s1 = interpAt(times, pts, s1Ms);
  const s2 = interpAt(times, pts, s2Ms);
  if (!s1 || !s2 || !isFiniteVec(s1) || !isFiniteVec(s2)) return null;
  return { s1, s2 };
}

export type SectorPoints = { s1: Vec2; s2: Vec2 };

// Resolve the S1/S2 boundary points (in F1-grid coords) for a circuit, trying a
// handful of recent sessions until one yields a usable lap + location trace.
export async function getSectorPoints(circuitKey: number): Promise<SectorPoints | null> {
  const sessions = await getJSON<Session[]>(`${BASE}/sessions?circuit_key=${circuitKey}`);
  const ranked = rankSessions(sessions ?? []);
  for (const s of ranked.slice(0, 4)) {
    const pts = await sectorPointsForSession(s.session_key);
    if (pts) return pts;
  }
  return null;
}
