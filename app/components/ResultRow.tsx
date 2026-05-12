import { teamColor } from "@/lib/teamColors";

// Shared row for the Starting Grid and Race Results lists so the two stay
// visually identical: position (or a red status label in its place), driver +
// team, a primary value (qualifying time / gap / retirement reason), and an
// optional trailing points column.
type Props = {
  pos: string;
  statusLabel?: string; // when set, shown in red instead of `pos`
  name: string;
  teamId: string;
  teamName: string;
  primary: string;
  points?: number;
};

export default function ResultRow({
  pos,
  statusLabel,
  name,
  teamId,
  teamName,
  primary,
  points,
}: Props) {
  const color = teamColor(teamId, teamName);
  return (
    <li
      className="flex items-center gap-3 rounded-xl border border-border p-3"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <span className="w-9 shrink-0 text-center font-mono text-xs">
        {statusLabel ? (
          <span className="font-semibold text-f1">{statusLabel}</span>
        ) : (
          <span className="tabular-nums text-muted">{pos}</span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{name}</span>
        <span className="block truncate text-xs text-muted">{teamName}</span>
      </span>
      <span className="shrink-0 font-mono text-sm tabular-nums text-muted">
        {primary}
      </span>
      {points !== undefined && (
        <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-muted">
          {points > 0 ? points : ""}
        </span>
      )}
    </li>
  );
}
