"use client";

import { useEffect, useState } from "react";
import Countdown from "./Countdown";

type Props = { round: string | number; initialISO: string };

export default function CountdownRefresher({ round, initialISO }: Props) {
  const [iso, setIso] = useState<string>(initialISO);

  useEffect(() => {
    let mounted = true;
    async function fetchIso() {
      try {
        const res = await fetch(`/api/race-time?round=${encodeURIComponent(String(round))}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data?.iso && data.iso !== iso) setIso(data.iso);
      } catch {
        // ignore network errors silently
      }
    }

    // initial check and interval
    fetchIso();
    const id = setInterval(fetchIso, 30_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [round, iso]);

  return <Countdown targetISO={iso} />;
}
