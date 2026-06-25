import { NextResponse } from "next/server";
import { ALL_PLAYERS } from "@/lib/pool";
import { standings } from "@/lib/scoring";
import { computeResults } from "@/lib/results";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const results = await computeResults();
    return NextResponse.json({
      computedAt: new Date().toISOString(),
      results,
      standings: standings(ALL_PLAYERS, results),
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e), hint: "Provision the database and run ingestion first." },
      { status: 503 },
    );
  }
}
