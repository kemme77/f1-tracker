export default function LiveTicker() {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted">
          Live Ticker
        </h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-muted" />
          offline
        </span>
      </div>

      <p className="mt-3 text-sm text-muted">
        Race-day live feed coming soon. Will pull race control events,
        position changes, intervals and pit stops from{" "}
        <a
          href="https://openf1.org"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground"
        >
          OpenF1
        </a>
        .
      </p>

      <ul className="mt-3 space-y-2">
        {[
          "🟡 Yellow flag",
          "🔵 Blue flag",
          "🏁 Lap +1 — leader change",
          "🛞 Pit stop completed",
        ].map((label) => (
          <li
            key={label}
            className="flex items-center gap-2 rounded-md border border-dashed border-border bg-surface-muted/50 px-3 py-1.5 text-xs text-muted"
          >
            <span>{label}</span>
            <span className="ml-auto font-mono">--:--</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
