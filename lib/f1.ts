const BASE = "https://api.jolpi.ca/ergast/f1";
const REVALIDATE_SECONDS = 60;

async function jget<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`Jolpica request failed: ${res.status} ${path}`);
  }
  return (await res.json()) as T;
}

export type Location = {
  lat: string;
  long: string;
  locality: string;
  country: string;
};

export type Circuit = {
  circuitId: string;
  url: string;
  circuitName: string;
  Location: Location;
};

export type Race = {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: Circuit;
  date: string;
  time?: string;
  FirstPractice?: { date: string; time: string };
  SecondPractice?: { date: string; time: string };
  ThirdPractice?: { date: string; time: string };
  Qualifying?: { date: string; time: string };
  Sprint?: { date: string; time: string };
  SprintQualifying?: { date: string; time: string };
  Results?: RaceResult[];
};

export type Driver = {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  givenName: string;
  familyName: string;
  nationality: string;
};

export type Constructor = {
  constructorId: string;
  name: string;
  nationality: string;
};

export type RaceResult = {
  position: string;
  points: string;
  Driver: Driver;
  Constructor: Constructor;
  grid: string;
  laps: string;
  status: string;
  Time?: { time: string };
  FastestLap?: { Time: { time: string } };
};

export type QualifyingResult = {
  position: string;
  number: string;
  Driver: Driver;
  Constructor: Constructor;
  Q1?: string;
  Q2?: string;
  Q3?: string;
};

export type QualifyingEntry = QualifyingResult & {
  status?: string; // e.g. 'DQ', 'DNS', etc.
};

export type DriverStanding = {
  position: string;
  points: string;
  wins: string;
  Driver: Driver;
  Constructors: Constructor[];
};

export type ConstructorStanding = {
  position: string;
  points: string;
  wins: string;
  Constructor: Constructor;
};

type MRData<T> = { MRData: T };

function toNumericPosition(position: string | undefined): number {
  const parsed = Number.parseInt(position ?? "", 10);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function hasAnyLapTime(entry: QualifyingEntry): boolean {
  return Boolean(entry.Q1 || entry.Q2 || entry.Q3);
}

function isQualifyingDQ(entry: QualifyingEntry): boolean {
  if (entry.status) return false;
  return (Boolean(entry.Q3) && (!entry.Q1 || !entry.Q2)) || (Boolean(entry.Q2) && !entry.Q1);
}

function sortByOriginalQualifyingPosition(a: QualifyingEntry, b: QualifyingEntry): number {
  return toNumericPosition(a.position) - toNumericPosition(b.position);
}

function renumberGrid(entries: QualifyingEntry[]): QualifyingEntry[] {
  const racing = entries.filter(
    (entry) => entry.status !== "PIT" && entry.status !== "DNS" && entry.status !== "DQ",
  );
  const pit = entries.filter((entry) => entry.status === "PIT");
  const dns = entries.filter((entry) => entry.status === "DNS");
  const dq = entries.filter((entry) => entry.status === "DQ");

  racing.sort(sortByOriginalQualifyingPosition);
  pit.sort(sortByOriginalQualifyingPosition);
  dns.sort(sortByOriginalQualifyingPosition);
  dq.sort(sortByOriginalQualifyingPosition);

  let position = 1;
  for (const entry of racing) entry.position = String(position++);
  for (const entry of pit) entry.position = String(position++);
  for (const entry of dns) entry.position = String(position++);
  for (const entry of dq) entry.position = String(position++);

  return [...racing, ...pit, ...dns, ...dq];
}

export async function getDriverStandings(): Promise<DriverStanding[]> {
  const data = await jget<
    MRData<{
      StandingsTable: {
        StandingsLists: { DriverStandings: DriverStanding[] }[];
      };
    }>
  >("/current/driverStandings.json");
  return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];
}

export async function getConstructorStandings(): Promise<ConstructorStanding[]> {
  const data = await jget<
    MRData<{
      StandingsTable: {
        StandingsLists: { ConstructorStandings: ConstructorStanding[] }[];
      };
    }>
  >("/current/constructorStandings.json");
  return (
    data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? []
  );
}

export async function getSchedule(): Promise<Race[]> {
  const data = await jget<MRData<{ RaceTable: { Races: Race[] } }>>(
    "/current.json",
  );
  return data.MRData.RaceTable.Races;
}

export async function getRaceWithResults(round: string): Promise<Race | null> {
  const data = await jget<MRData<{ RaceTable: { Races: Race[] } }>>(
    `/current/${round}/results.json`,
  );
  return data.MRData.RaceTable.Races[0] ?? null;
}

export async function getRaceGrid(round: string): Promise<QualifyingEntry[]> {
  try {
    const data = await jget<
      MRData<{ RaceTable: { Races: (Race & { QualifyingResults?: QualifyingResult[] })[] } }>
    >(`/current/${round}/qualifying.json`);
    const race = data.MRData.RaceTable.Races[0];
    const quals: QualifyingEntry[] = (race?.QualifyingResults ?? []).map((q) => ({ ...q }));

    // If race has run, RaceResult.grid is authoritative starting grid (post penalties/DQ)
    let gridByDriver: Map<string, string> | null = null;
    try {
      const resultsRace = await getRaceWithResults(round);
      if (resultsRace?.Results && resultsRace.Results.length > 0) {
        gridByDriver = new Map<string, string>();
        for (const r of resultsRace.Results) {
          if (r.Driver?.driverId) gridByDriver.set(r.Driver.driverId, r.grid);
        }
      }
    } catch {
      // ignore: race not run yet, use qualifying-only logic below
    }

    if (gridByDriver) {
      for (const q of quals) {
        const g = gridByDriver.get(q.Driver.driverId);
        if (g === undefined) {
          q.status = "DNS";
          continue;
        }
        if (g === "0") {
          q.status = "PIT";
        } else {
          q.position = g;
        }
      }
      return renumberGrid(quals);
    }

    // Quali-only DQ detection: later-stage times without the prior stage are not valid progression.
    for (const q of quals) {
      if (isQualifyingDQ(q)) q.status = "DQ";
    }

    // Fallback: duplicated positions where only one entry is missing all times.
    const byPos = new Map<string, QualifyingEntry[]>();
    for (const q of quals) {
      const list = byPos.get(q.position) ?? [];
      list.push(q);
      byPos.set(q.position, list);
    }
    for (const list of byPos.values()) {
      if (list.length <= 1) continue;
      const withNoTimes = list.filter((e) => !hasAnyLapTime(e));
      if (withNoTimes.length === 1) withNoTimes[0].status = "DQ";
    }

    return renumberGrid(quals);
  } catch {
    return [];
  }
}

export async function getCircuitWinners(
  circuitId: string,
  limit = 30,
): Promise<Race[]> {
  const data = await jget<MRData<{ RaceTable: { Races: Race[] } }>>(
    `/circuits/${circuitId}/results/1.json?limit=${limit}`,
  );
  return data.MRData.RaceTable.Races;
}

export function raceStartUTC(race: Race): Date | null {
  if (!race.date) return null;
  const iso = race.time
    ? `${race.date}T${race.time.replace(/Z?$/, "Z")}`
    : `${race.date}T00:00:00Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}
