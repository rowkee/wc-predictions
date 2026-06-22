// Authoritative standings: derive Results from stored data, run the scoring
// engine server-side, return the ranked table. The browser only renders this —
// it never computes scores.
//   GET /api/standings           → 5-player pool
//   GET /api/standings?all=1     → includes the 2 extra players

import { NextResponse } from "next/server";
import { PEOPLE, ALL_PLAYERS } from "@/lib/pool";
import { standings } from "@/lib/scoring";
import { computeResults } from "@/lib/results";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const all = new URL(req.url).searchParams.get("all");
  const players = all ? ALL_PLAYERS : PEOPLE;
  try {
    const results = await computeResults();
    return NextResponse.json({
      computedAt: new Date().toISOString(),
      results,
      standings: standings(players, results),
    });
  } catch (e) {
    // Most likely DATABASE_URL not set yet / no data ingested.
    return NextResponse.json(
      { error: String(e), hint: "Provision the database and run ingestion first." },
      { status: 503 },
    );
  }
}
