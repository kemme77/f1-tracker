import type { TrackPath } from "@/lib/circuitGeo";

type Props = {
  path: TrackPath;
  ariaLabel: string;
  strokeWidth?: number;
  showSectorLabels?: boolean;
};

const SECTOR_COLORS = [
  "var(--sector-1)",
  "var(--sector-2)",
  "var(--sector-3)",
] as const;

export default function TrackSVG({
  path,
  ariaLabel,
  strokeWidth = 7,
  showSectorLabels = false,
}: Props) {
  return (
    <svg
      viewBox={path.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="track-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* Soft glow underlay */}
      <g opacity="0.25" filter="url(#track-glow)">
        {path.sectors.map((d, i) => (
          <path
            key={`glow-${i}`}
            d={d}
            fill="none"
            stroke={SECTOR_COLORS[i]}
            strokeWidth={strokeWidth + 6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* Sector segments */}
      {path.sectors.map((d, i) => (
        <path
          key={`sector-${i}`}
          d={d}
          fill="none"
          stroke={SECTOR_COLORS[i]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* Start / Finish marker */}
      <g transform={`translate(${path.start.x},${path.start.y})`}>
        <circle r={11} fill="white" stroke="black" strokeWidth={2} />
        <circle r={5} fill="var(--f1-red)" />
      </g>

      {showSectorLabels && (
        <g
          fontSize="14"
          fontFamily="var(--font-geist-mono, ui-monospace, monospace)"
          fontWeight="600"
        >
          <text x={20} y={28} fill={SECTOR_COLORS[0]}>
            S1
          </text>
          <text x={60} y={28} fill={SECTOR_COLORS[1]}>
            S2
          </text>
          <text x={100} y={28} fill={SECTOR_COLORS[2]}>
            S3
          </text>
        </g>
      )}
    </svg>
  );
}
