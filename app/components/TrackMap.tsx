"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { TurnMarker } from "@/lib/multiviewer";

type Props = {
  coordinates: [number, number][];
  sfIdx: number;
  turns: TurnMarker[];
  label: string;
};

// Official F1 sector timing colours
const S1 = "#e10600";
const S2 = "#00d2be";
const S3 = "#facc15";

function sectorSplitIndices(
  coords: [number, number][],
  sfIdx: number,
): [number, number] {
  const n = coords.length;
  const cum: number[] = [0];
  for (let i = 1; i < n; i++) {
    const ci = (sfIdx + i) % n;
    const cp = (sfIdx + i - 1) % n;
    const cosLat = Math.cos(
      (((coords[ci][1] + coords[cp][1]) / 2) * Math.PI) / 180,
    );
    const dx = (coords[ci][0] - coords[cp][0]) * cosLat;
    const dy = coords[ci][1] - coords[cp][1];
    cum.push(cum[i - 1] + Math.hypot(dx, dy));
  }
  const total = cum[n - 1];
  let e1 = 0,
    e2 = 0;
  for (let i = 0; i < n; i++) {
    if (cum[i] <= total / 3) e1 = i;
    if (cum[i] <= (2 * total) / 3) e2 = i;
  }
  return [(sfIdx + e1) % n, (sfIdx + e2) % n];
}

// Perpendicular tick line across the track at coords[idx].
function perpTick(
  coords: [number, number][],
  idx: number,
  halfDeg: number,
): [[number, number], [number, number]] {
  const n = coords.length;
  const c = coords[idx];
  const prev = coords[(idx - 1 + n) % n];
  const next = coords[(idx + 1) % n];
  const cosLat = Math.cos((c[1] * Math.PI) / 180);
  const dx = (next[0] - prev[0]) * cosLat;
  const dy = next[1] - prev[1];
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  return [
    [c[0] + (px * halfDeg) / cosLat, c[1] + py * halfDeg],
    [c[0] - (px * halfDeg) / cosLat, c[1] - py * halfDeg],
  ];
}

function labelEl(text: string, bg: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = [
    `background:${bg}`,
    "border-radius:3px",
    "padding:2px 6px",
    "font-size:9px",
    "font-weight:800",
    "letter-spacing:0.04em",
    "color:#000",
    "font-family:ui-monospace,monospace",
    "white-space:nowrap",
    "border:1.5px solid rgba(0,0,0,0.7)",
    "box-shadow:0 1px 4px rgba(0,0,0,0.55)",
    "line-height:1.5",
    "pointer-events:none",
  ].join(";");
  el.textContent = text;
  return el;
}

function turnEl(num: number): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = [
    "width:16px",
    "height:16px",
    "border-radius:50%",
    "background:rgba(15,15,15,0.88)",
    "border:1.5px solid rgba(255,255,255,0.55)",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "font-size:7px",
    "font-weight:700",
    "color:#fff",
    "font-family:ui-monospace,monospace",
    "pointer-events:none",
    "box-shadow:0 1px 3px rgba(0,0,0,0.7)",
    "line-height:1",
  ].join(";");
  el.textContent = String(num).padStart(2, "0");
  return el;
}

const ESRI_SATELLITE = {
  version: 8 as const,
  sources: {
    esri: {
      type: "raster" as const,
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri",
      maxzoom: 19,
    },
  },
  layers: [{ id: "esri-satellite", type: "raster" as const, source: "esri" }],
};

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M1 6V1h5M15 6V1h-5M1 10v5h5M15 10v5h-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CompressIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6 1v5H1M10 1v5h5M6 15v-5H1M10 15v-5h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TrackMap({ coordinates, sfIdx, turns, label }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!containerRef.current || coordinates.length < 2) return;

    const lons = coordinates.map((c) => c[0]);
    const lats = coordinates.map((c) => c[1]);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: ESRI_SATELLITE,
      attributionControl: false,
    });

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;

    map.on("load", () => {
      map.fitBounds(bounds, { padding: 48, animate: false });

      const [s1end, s2end] = sectorSplitIndices(coordinates, sfIdx);
      const n = coordinates.length;

      function sliceWrapped(from: number, to: number): [number, number][] {
        const out: [number, number][] = [];
        let i = from;
        while (i !== to) {
          out.push(coordinates[i]);
          i = (i + 1) % n;
        }
        out.push(coordinates[to]);
        return out;
      }

      const segments = [
        { id: "s1", path: sliceWrapped(sfIdx, s1end), color: S1 },
        { id: "s2", path: sliceWrapped(s1end, s2end), color: S2 },
        { id: "s3", path: sliceWrapped(s2end, sfIdx), color: S3 },
      ];

      for (const { id, path, color } of segments) {
        map.addSource(id, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: path },
            properties: {},
          },
        });
        map.addLayer({
          id: `${id}-glow`,
          type: "line",
          source: id,
          paint: {
            "line-color": color,
            "line-width": 10,
            "line-blur": 6,
            "line-opacity": 0.35,
          },
          layout: { "line-cap": "round", "line-join": "round" },
        });
        map.addLayer({
          id: `${id}-line`,
          type: "line",
          source: id,
          paint: { "line-color": color, "line-width": 3 },
          layout: { "line-cap": "round", "line-join": "round" },
        });
      }

      // Tick marks at S/F, S2-start, S3-start
      const HALF = 0.0003;
      const ticks = [
        { idx: sfIdx, color: "#ffffff", text: "S/F" },
        { idx: s1end, color: S2, text: "S2" },
        { idx: s2end, color: S3, text: "S3" },
      ];

      for (const { idx, color, text } of ticks) {
        const [p1, p2] = perpTick(coordinates, idx, HALF);

        map.addSource(`tick-${text}`, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: [p1, p2] },
            properties: {},
          },
        });
        map.addLayer({
          id: `tick-${text}-outline`,
          type: "line",
          source: `tick-${text}`,
          paint: { "line-color": "#000000", "line-width": 5 },
          layout: { "line-cap": "butt" },
        });
        map.addLayer({
          id: `tick-${text}-fill`,
          type: "line",
          source: `tick-${text}`,
          paint: { "line-color": color, "line-width": 3 },
          layout: { "line-cap": "butt" },
        });

        // Label just outside the track at one end of the tick
        const center = coordinates[idx];
        const extLon = p1[0] + (p1[0] - center[0]) * 0.9;
        const extLat = p1[1] + (p1[1] - center[1]) * 0.9;
        new maplibregl.Marker({ element: labelEl(text, color), anchor: "center" })
          .setLngLat([extLon, extLat])
          .addTo(map);
      }

      // Turn number markers from MultiViewer data
      for (const turn of turns) {
        new maplibregl.Marker({ element: turnEl(turn.number), anchor: "center" })
          .setLngLat(turn.coord)
          .addTo(map);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [coordinates, sfIdx, turns]);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => mapRef.current?.resize(), 0);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapperRef.current?.requestFullscreen();
    }
  };

  return (
    <div ref={wrapperRef} className="relative h-full w-full">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="img"
        aria-label={label}
      />
      <button
        onClick={toggleFullscreen}
        className="absolute right-2 top-2 rounded-md bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <CompressIcon /> : <ExpandIcon />}
      </button>
    </div>
  );
}
