"use client";

import { useEffect, useState } from "react";

type Props = { targetISO: string };

function formatDelta(ms: number): string {
  if (ms <= 0) return "Live / Past";
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const parts = [
    days > 0 ? `${days}d` : null,
    `${String(hours).padStart(2, "0")}h`,
    `${String(minutes).padStart(2, "0")}m`,
    `${String(seconds).padStart(2, "0")}s`,
  ].filter(Boolean);
  return parts.join(" ");
}

export default function Countdown({ targetISO }: Props) {
  const target = new Date(targetISO).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // set initial client time and start ticking (deferred to avoid sync setState in effect)
    setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) {
    // deterministic placeholder rendered both server and initial client render
    const isoPlaceholder = new Date(targetISO).toISOString().replace("T", " ").replace("Z", " UTC");
    return <span className="font-mono tabular-nums tracking-tight">{isoPlaceholder}</span>;
  }

  return (
    <span className="font-mono tabular-nums tracking-tight">
      {formatDelta(target - now)}
    </span>
  );
}
