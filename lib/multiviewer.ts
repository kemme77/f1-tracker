// MultiViewer API — accurate corner positions and the start/finish line.
//
// MultiViewer returns the lap geometry in its own local coordinate grid (the
// `x`/`y` arrays, with index 0 = start/finish). The bacinger GeoJSON gives us
// the same loop in lon/lat. We fit a best-fit similarity transform (uniform
// scale + rotation + optional reflection + translation) from the MultiViewer
// grid onto bacinger's local-metre projection, then map every corner — and the
// S/F point — through it. This anchors the S/F tick, the sector splits and the
// turn numbers to the *racing* reference instead of wherever OSM happened to
// start the way (which is arbitrary and was the source of the visible offset).

export type TurnMarker = {
  number: number;
  coord: [number, number]; // [lon, lat]
};

export type CircuitOverlay = {
  turns: TurnMarker[];
  // Index into the bacinger coordinate array nearest to the start/finish line.
  sfIdx: number;
};

// Map bacinger circuitId → MultiViewer circuitKey
const MV_KEY: Record<string, number> = {
  albert_park: 10,
  americas: 9,
  bahrain: 63,
  baku: 144,
  catalunya: 15,
  hungaroring: 4,
  imola: 6,
  interlagos: 14,
  jeddah: 149,
  losail: 150,
  marina_bay: 61,
  miami: 151,
  monaco: 22,
  monza: 39,
  red_bull_ring: 19,
  rodriguez: 65,
  shanghai: 49,
  silverstone: 2,
  spa: 7,
  suzuka: 46,
  vegas: 152,
  villeneuve: 23,
  yas_marina: 70,
  zandvoort: 55,
};

type MVCorner = {
  number: number;
  trackPosition: { x: number; y: number };
};

type MVData = {
  x: number[];
  y: number[];
  corners: MVCorner[];
};

async function fetchMV(key: number): Promise<MVData | null> {
  for (const year of [2026, 2025, 2024, 2023]) {
    try {
      const res = await fetch(
        `https://api.multiviewer.app/api/v1/circuits/${key}/${year}`,
        { next: { revalidate: 60 * 60 * 24 * 30 } },
      );
      if (res.ok) return res.json() as Promise<MVData>;
    } catch {
      // try next year
    }
  }
  return null;
}

type Vec2 = [number, number];

function arcLengths(pts: Vec2[]): number[] {
  const out = new Array<number>(pts.length);
  out[0] = 0;
  for (let i = 1; i < pts.length; i++) {
    out[i] =
      out[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return out;
}

// Resample a closed loop into `n` points spaced evenly by arc length, starting at pts[0].
function resampleClosed(pts: Vec2[], n: number): Vec2[] {
  const last = pts[pts.length - 1];
  const loop =
    pts[0][0] === last[0] && pts[0][1] === last[1] ? pts : [...pts, pts[0]];
  const cum = arcLengths(loop);
  const total = cum[cum.length - 1];
  const out: Vec2[] = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const t = (total * k) / n;
    while (j < cum.length - 1 && cum[j + 1] < t) j++;
    if (j >= cum.length - 1) {
      out.push(loop[loop.length - 1]);
      continue;
    }
    const seg = cum[j + 1] - cum[j];
    const f = seg > 0 ? (t - cum[j]) / seg : 0;
    out.push([
      loop[j][0] + f * (loop[j + 1][0] - loop[j][0]),
      loop[j][1] + f * (loop[j + 1][1] - loop[j][1]),
    ]);
  }
  return out;
}

function centroid(pts: Vec2[]): Vec2 {
  let x = 0,
    y = 0;
  for (const p of pts) {
    x += p[0];
    y += p[1];
  }
  return [x / pts.length, y / pts.length];
}

// Fit q ≈ s·R·p (+ reflection) + t mapping the MultiViewer grid onto the
// bacinger local-metre projection. Returns a transform for arbitrary MV points,
// or null when no acceptable fit exists.
function fitSimilarity(
  mvLoop: Vec2[],
  bacLoop: Vec2[],
): ((p: Vec2) => Vec2) | null {
  const N = 360;
  if (mvLoop.length < 2 || bacLoop.length < 2) return null;

  const M = resampleClosed(mvLoop, N);
  const B = resampleClosed(bacLoop, N);
  const mc = centroid(M);
  const bc = centroid(B);
  const a: Vec2[] = M.map(([x, y]) => [x - mc[0], y - mc[1]]);
  const b: Vec2[] = B.map(([x, y]) => [x - bc[0], y - bc[1]]);

  let den = 0;
  let sumB2 = 0;
  for (let i = 0; i < N; i++) {
    den += a[i][0] * a[i][0] + a[i][1] * a[i][1];
    sumB2 += b[i][0] * b[i][0] + b[i][1] * b[i][1];
  }
  if (den === 0) return null;

  // For a fixed pairing, the optimal complex multiplier w = (Σ bᵢ·conj(aᵢ)) / Σ|aᵢ|²
  // and the residual is Σ|bᵢ|² − |Σ bᵢ·conj(aᵢ)|² / Σ|aᵢ|². Σ|aᵢ|² and Σ|bᵢ|² are
  // pairing-independent, so we just search for the pairing that maximises |Σ bᵢ·conj(aᵢ)|.
  let best: { res: number; wr: number; wi: number; mirror: boolean } | null = null;
  for (const mirror of [false, true]) {
    const aSrc: Vec2[] = mirror ? a.map(([x, y]) => [x, -y]) : a;
    for (const reversed of [false, true]) {
      for (let s = 0; s < N; s++) {
        let nr = 0;
        let ni = 0;
        for (let i = 0; i < N; i++) {
          const idx = reversed ? (((s - i) % N) + N) % N : (i + s) % N;
          const ax = aSrc[idx][0];
          const ay = aSrc[idx][1];
          const bx = b[i][0];
          const by = b[i][1];
          // bᵢ · conj(aᵢ) = (bx·ax + by·ay) + i(by·ax − bx·ay)
          nr += bx * ax + by * ay;
          ni += by * ax - bx * ay;
        }
        const res = sumB2 - (nr * nr + ni * ni) / den;
        if (!best || res < best.res) {
          best = { res, wr: nr / den, wi: ni / den, mirror };
        }
      }
    }
  }
  if (!best) return null;

  // Reject implausible fits (e.g. a circuit whose bacinger layout no longer
  // matches the MultiViewer one). A real fit lands within centimetres-to-metres;
  // this tolerates RMS error up to ~14% of the loop radius.
  if (best.res / N > (sumB2 / N) * 0.02) return null;

  const { wr, wi, mirror } = best;
  return (p: Vec2): Vec2 => {
    const px = p[0] - mc[0];
    const py = mirror ? -(p[1] - mc[1]) : p[1] - mc[1];
    // w · (px + i·py) = (wr·px − wi·py) + i(wr·py + wi·px)
    return [wr * px - wi * py + bc[0], wr * py + wi * px + bc[1]];
  };
}

function nearestIdx(coords: [number, number][], target: [number, number]): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const d = Math.hypot(coords[i][0] - target[0], coords[i][1] - target[1]);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

export async function getCircuitOverlay(
  circuitId: string,
  trackCoords: [number, number][],
): Promise<CircuitOverlay> {
  const fallback: CircuitOverlay = { turns: [], sfIdx: 0 };

  const key = MV_KEY[circuitId];
  if (key === undefined || trackCoords.length < 2) return fallback;

  const mv = await fetchMV(key);
  if (
    !mv ||
    !Array.isArray(mv.x) ||
    !Array.isArray(mv.y) ||
    mv.x.length < 2 ||
    mv.x.length !== mv.y.length ||
    !Array.isArray(mv.corners) ||
    mv.corners.length === 0
  ) {
    return fallback;
  }

  try {
    let lon0 = 0;
    let lat0 = 0;
    for (const [lon, lat] of trackCoords) {
      lon0 += lon;
      lat0 += lat;
    }
    lon0 /= trackCoords.length;
    lat0 /= trackCoords.length;

    const M_PER_DEG_LAT = 111320;
    const mPerDegLon = 111320 * Math.cos((lat0 * Math.PI) / 180) || 1;
    const toLocal = ([lon, lat]: [number, number]): Vec2 => [
      (lon - lon0) * mPerDegLon,
      (lat - lat0) * M_PER_DEG_LAT,
    ];
    const toLonLat = ([x, y]: Vec2): [number, number] => [
      x / mPerDegLon + lon0,
      y / M_PER_DEG_LAT + lat0,
    ];

    const bacLoop = trackCoords.map(toLocal);
    const mvLoop: Vec2[] = mv.x.map((x, i) => [x, mv.y[i]]);
    const transform = fitSimilarity(mvLoop, bacLoop);
    if (!transform) return fallback;

    const sfLonLat = toLonLat(transform([mv.x[0], mv.y[0]]));
    const sfIdx = nearestIdx(trackCoords, sfLonLat);

    const turns: TurnMarker[] = mv.corners
      .filter(
        (c) =>
          c &&
          typeof c.number === "number" &&
          c.trackPosition &&
          Number.isFinite(c.trackPosition.x) &&
          Number.isFinite(c.trackPosition.y),
      )
      .map((c) => ({
        number: c.number,
        coord: toLonLat(transform([c.trackPosition.x, c.trackPosition.y])),
      }));

    return { turns, sfIdx };
  } catch {
    return fallback;
  }
}
