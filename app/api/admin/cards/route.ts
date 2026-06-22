// Manual card-total override — there's no free live source for 2026 World Cup
// cards, so this lets the total be set by hand. Guarded by CRON_SECRET.
//   POST /api/admin/cards?total=340     (Authorization: Bearer <CRON_SECRET>)
//   GET  /api/admin/cards               → current stored value

import { NextResponse } from "next/server";
import { initSchema, setManualCards, getManualCards } from "@/lib/db";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // refuse if not configured — this writes data
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET() {
  try {
    const total = await getManualCards();
    return NextResponse.json({ manualCardsTotal: total });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const total = Number(new URL(req.url).searchParams.get("total"));
  if (!Number.isFinite(total) || total < 0) {
    return NextResponse.json({ error: "pass ?total=<non-negative number>" }, { status: 400 });
  }
  await initSchema();
  await setManualCards(total);
  return NextResponse.json({ ok: true, manualCardsTotal: total });
}
