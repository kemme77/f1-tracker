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
//
// The two timing-sector boundaries come from OpenF1 (lib/openf1.ts): a real
// lap's S1/S2 split times projected onto the car's position trace, which lives
// in the very same F1 grid as MultiViewer's `x`/`y`, so the same transform maps
// them straight onto the outline. SECTOR_END_TURNS is only the fallback for
// circuits OpenF1 has no data for.

import { SECTOR_END_TURNS } from "./sectors";
import { getSectorPoints } from "./openf1";

export type TurnMarker = {
  number: number;
  coord: [number, number]; // [lon, lat]
};

export type CircuitOverlay = {
  turns: TurnMarker[];
  // The track outline to render, oriented in the racing direction (this may be
  // a reversed copy of the input). Falls back to the caller's own coordinates
  // when the overlay couldn't be built. All indices below point into this.
  coordinates?: [number, number][];
  // Index of the vertex at the start/finish line.
  sfIdx: number;
  // Indices of the vertices at the end of sector 1 and sector 2. Undefined when
  // no split could be resolved — the consumer should fall back to an even
  // arc-length split.
  s1Idx?: number;
  s2Idx?: number;
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

// --- arc-length tooling for placing the sector splits ---------------------
//
// A sector boundary point lives in the F1 grid. Mapping it onto the bacinger
// outline through the global similarity transform works, but the transform's
// residual shape error is largest exactly where two bits of track run close
// together — which is also where a misplaced split is most obvious. So instead
// we treat distance-along-the-lap as the shared coordinate: project the point
// onto the MultiViewer centreline to get its lap distance, then carry that
// distance onto the bacinger loop through a piecewise-linear warp anchored on
// the corner positions (which the transform places reliably, away from
// parallel straights). Between two nearby anchors the relationship is as good
// as the local survey agreement.

function segLengthsClosed(pts: Vec2[]): { seg: number[]; total: number } {
  const n = pts.length;
  const seg = new Array<number>(n);
  let total = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const d = Math.hypot(pts[j][0] - pts[i][0], pts[j][1] - pts[i][1]);
    seg[i] = d;
    total += d;
  }
  return { seg, total };
}

// Distance from pts[0] (forward) to the foot of P's perpendicular on the loop.
function arcOfNearestPoint(pts: Vec2[], seg: number[], P: Vec2): number {
  const n = pts.length;
  let bd2 = Infinity;
  let bi = 0;
  let bt = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    let t = len2 > 0 ? ((P[0] - a[0]) * dx + (P[1] - a[1]) * dy) / len2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const ddx = P[0] - (a[0] + t * dx);
    const ddy = P[1] - (a[1] + t * dy);
    const d2 = ddx * ddx + ddy * ddy;
    if (d2 < bd2) {
      bd2 = d2;
      bi = i;
      bt = t;
    }
  }
  let arc = 0;
  for (let i = 0; i < bi; i++) arc += seg[i];
  return arc + bt * seg[bi];
}

export async function getCircuitOverlay(
  circuitId: string,
  trackCoords: [number, number][],
): Promise<CircuitOverlay> {
  const fallback: CircuitOverlay = { turns: [], sfIdx: 0 };

  const key = MV_KEY[circuitId];
  if (key === undefined || trackCoords.length < 2) return fallback;

  const [mv, sectorPts] = await Promise.all([fetchMV(key), getSectorPoints(key)]);
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
    let sfIdx = nearestIdx(trackCoords, sfLonLat);

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

    let s1Idx: number | undefined;
    let s2Idx: number | undefined;

    // Anchor map: lap-parameter (0..1) of each MV corner ↔ matching bacinger
    // vertex. Corners sit at apexes, away from parallel straights, so the
    // transform places them reliably — they make sturdy control points even
    // where it can't be trusted for an arbitrary point (e.g. a straight running
    // close alongside another bit of track, where `nearestIdx` would jump).
    const n = trackCoords.length;
    const { seg: mvSeg, total: mvTotal } = segLengthsClosed(mvLoop);
    const uOfMv = (p: Vec2) => arcOfNearestPoint(mvLoop, mvSeg, p) / mvTotal;
    const cornerAnchors = mv.corners
      .filter(
        (c) =>
          c &&
          c.trackPosition &&
          Number.isFinite(c.trackPosition.x) &&
          Number.isFinite(c.trackPosition.y),
      )
      .map((c) => {
        const p: Vec2 = [c.trackPosition.x, c.trackPosition.y];
        return { uMv: uOfMv(p), bacIdx: nearestIdx(trackCoords, toLonLat(transform(p))) };
      })
      .sort((a, b) => a.uMv - b.uMv);

    // bacinger lap-parameter (0..1) of every vertex, in index order.
    const bacCum = new Array<number>(n);
    {
      let acc = 0;
      for (let i = 0; i < n; i++) {
        bacCum[i] = acc;
        acc += Math.hypot(
          bacLoop[(i + 1) % n][0] - bacLoop[i][0],
          bacLoop[(i + 1) % n][1] - bacLoop[i][1],
        );
      }
      const total = acc || 1;
      for (let i = 0; i < n; i++) bacCum[i] /= total;
    }

    // Does increasing MV lap-parameter step bacinger indices up or down? Some
    // bacinger outlines are stored against the racing direction.
    let fwd = 0;
    let votes = 0;
    for (let i = 0; i + 1 < cornerAnchors.length; i++) {
      const step = (cornerAnchors[i + 1].bacIdx - cornerAnchors[i].bacIdx + n) % n;
      if (step !== 0) {
        votes++;
        if (step <= n - step) fwd++;
      }
    }
    const dir: 1 | -1 = votes === 0 || fwd * 2 >= votes ? 1 : -1;
    const uBac = (idx: number): number => (dir > 0 ? bacCum[idx] : (1 - bacCum[idx]) % 1);
    const vertexAtU = (u: number): number => {
      let best = 0;
      let bd = Infinity;
      for (let i = 0; i < n; i++) {
        let d = Math.abs(uBac(i) - u);
        d = Math.min(d, 1 - d);
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      return best;
    };

    if (sectorPts && cornerAnchors.length >= 2) {
      // Unroll the bacinger params so they rise monotonically alongside uMv,
      // then wrap the sequence onto itself for periodic linear interpolation.
      const samples: { a: number; b: number }[] = [
        { a: cornerAnchors[0].uMv, b: uBac(cornerAnchors[0].bacIdx) },
      ];
      for (let i = 1; i < cornerAnchors.length; i++) {
        let b = uBac(cornerAnchors[i].bacIdx);
        while (b < samples[samples.length - 1].b) b += 1;
        samples.push({ a: cornerAnchors[i].uMv, b });
      }
      const f0 = samples[0];
      const fN = samples[samples.length - 1];
      const knots = [{ a: fN.a - 1, b: fN.b - 1 }, ...samples, { a: f0.a + 1, b: f0.b + 1 }];
      const mapU = (u: number): number => {
        let a = u;
        while (a < knots[0].a) a += 1;
        while (a > knots[knots.length - 1].a) a -= 1;
        let b = knots[knots.length - 1].b;
        for (let i = 0; i + 1 < knots.length; i++) {
          if (a >= knots[i].a && a <= knots[i + 1].a) {
            const da = knots[i + 1].a - knots[i].a;
            const f = da > 0 ? (a - knots[i].a) / da : 0;
            b = knots[i].b + f * (knots[i + 1].b - knots[i].b);
            break;
          }
        }
        return ((b % 1) + 1) % 1;
      };

      // S/F (uMv = 0) re-derived through the same warp — overrides the raw
      // transform hit, which can snap to the wrong side of a parallel straight.
      sfIdx = vertexAtU(mapU(0));
      s1Idx = vertexAtU(mapU(uOfMv(sectorPts.s1)));
      s2Idx = vertexAtU(mapU(uOfMv(sectorPts.s2)));
    } else if (!sectorPts) {
      // No live timing for this circuit → hand-picked corner numbers.
      const split = SECTOR_END_TURNS[circuitId];
      if (split) {
        const [s1Turn, s2Turn] = split;
        const t1 = turns.find((t) => t.number === s1Turn);
        const t2 = turns.find((t) => t.number === s2Turn);
        if (t1) s1Idx = nearestIdx(trackCoords, t1.coord);
        if (t2) s2Idx = nearestIdx(trackCoords, t2.coord);
      }
    }

    // If the bacinger outline runs against the racing direction, hand back a
    // reversed copy so the consumer can always walk it forwards by index.
    if (dir < 0) {
      const rev = (i: number) => (n - 1 - i + n) % n;
      return {
        turns,
        coordinates: [...trackCoords].reverse(),
        sfIdx: rev(sfIdx),
        s1Idx: s1Idx === undefined ? undefined : rev(s1Idx),
        s2Idx: s2Idx === undefined ? undefined : rev(s2Idx),
      };
    }
    return { turns, coordinates: trackCoords, sfIdx, s1Idx, s2Idx };
  } catch {
    return fallback;
  }
}
