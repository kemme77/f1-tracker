const COLORS: Record<string, string> = {
  red_bull: "#3671C6",
  ferrari: "#E80020",
  mercedes: "#27F4D2",
  mclaren: "#FF8000",
  aston_martin: "#229971",
  alpine: "#0093CC",
  williams: "#64C4FF",
  rb: "#6692FF",
  alphatauri: "#6692FF",
  sauber: "#52E252",
  alfa: "#52E252",
  haas: "#B6BABD",
};

const NAME_FALLBACK: Record<string, string> = {
  "Red Bull": "#3671C6",
  Ferrari: "#E80020",
  Mercedes: "#27F4D2",
  McLaren: "#FF8000",
  "Aston Martin": "#229971",
  Alpine: "#0093CC",
  "Alpine F1 Team": "#0093CC",
  Williams: "#64C4FF",
  RB: "#6692FF",
  "RB F1 Team": "#6692FF",
  AlphaTauri: "#6692FF",
  Sauber: "#52E252",
  "Kick Sauber": "#52E252",
  "Alfa Romeo": "#52E252",
  Haas: "#B6BABD",
  "Haas F1 Team": "#B6BABD",
};

export function teamColor(constructorId: string, name?: string): string {
  return COLORS[constructorId] ?? (name && NAME_FALLBACK[name]) ?? "#9CA3AF";
}
