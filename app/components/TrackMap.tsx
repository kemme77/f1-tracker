"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Props = {
  coordinates: [number, number][];
  label: string;
};

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

export default function TrackMap({ coordinates, label }: Props) {
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

      map.addSource("track", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "LineString", coordinates },
          properties: {},
        },
      });

      map.addLayer({
        id: "track-glow",
        type: "line",
        source: "track",
        paint: {
          "line-color": "#e10600",
          "line-width": 10,
          "line-blur": 6,
          "line-opacity": 0.4,
        },
        layout: { "line-cap": "round", "line-join": "round" },
      });

      map.addLayer({
        id: "track-line",
        type: "line",
        source: "track",
        paint: { "line-color": "#e10600", "line-width": 3 },
        layout: { "line-cap": "round", "line-join": "round" },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [coordinates]);

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
