import { NextResponse } from "next/server";
import { getSchedule, raceStartUTC } from "@/lib/f1";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const round = url.searchParams.get("round");

  if (!round) {
    return NextResponse.json({ error: "Missing round" }, { status: 400 });
  }

  const schedule = await getSchedule();
  const race = schedule.find((entry) => entry.round === round);

  if (!race) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  const start = raceStartUTC(race);

  if (!start) {
    return NextResponse.json({ error: "Race time unavailable" }, { status: 404 });
  }

  return NextResponse.json({ iso: start.toISOString() });
}