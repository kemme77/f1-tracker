"use client";

import { useEffect, useState } from "react";

type Props = {
  iso: string;
  label?: string;
};

export default function LocalTime({ iso, label }: Props) {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      setText(iso);
      return;
    }
    setText(
      d.toLocaleString(undefined, {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  }, [iso]);

  return (
    <span className="inline-flex items-baseline gap-1">
      {label && <span className="text-zinc-500">{label}</span>}
      <span className="font-medium">{text || "—"}</span>
    </span>
  );
}
