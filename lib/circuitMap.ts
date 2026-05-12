const CIRCUIT_FILE: Record<string, string> = {
  albert_park: "au-1953",
  americas: "us-2012",
  bahrain: "bh-2002",
  baku: "az-2016",
  catalunya: "es-1991",
  hungaroring: "hu-1986",
  imola: "it-1953",
  interlagos: "br-1940",
  jeddah: "sa-2021",
  losail: "qa-2004",
  madring: "es-2026",
  marina_bay: "sg-2008",
  miami: "us-2022",
  monaco: "mc-1929",
  monza: "it-1922",
  red_bull_ring: "at-1969",
  rodriguez: "mx-1962",
  shanghai: "cn-2004",
  silverstone: "gb-1948",
  spa: "be-1925",
  suzuka: "jp-1962",
  vegas: "us-2023",
  villeneuve: "ca-1978",
  yas_marina: "ae-2009",
  zandvoort: "nl-1948",
};

export function bacingerFile(circuitId: string): string | null {
  return CIRCUIT_FILE[circuitId] ?? null;
}
