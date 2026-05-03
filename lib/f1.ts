const BASE = "https://api.jolpi.ca/ergast/f1";
const REVALIDATE_SECONDS = 300;

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

export async function getNextRace(): Promise<Race | null> {
  const data = await jget<
    MRData<{ RaceTable: { Races: Race[] } }>
  >("/current/next.json");
  return data.MRData.RaceTable.Races[0] ?? null;
}

export async function getLastRaceResults(): Promise<Race | null> {
  const data = await jget<
    MRData<{ RaceTable: { Races: Race[] } }>
  >("/current/last/results.json");
  return data.MRData.RaceTable.Races[0] ?? null;
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

export function raceStartUTC(race: Race): Date | null {
  if (!race.date) return null;
  const iso = race.time
    ? `${race.date}T${race.time.replace(/Z?$/, "Z")}`
    : `${race.date}T00:00:00Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}
