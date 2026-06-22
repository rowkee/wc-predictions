// Scheduled ingestion. Polls the providers and UPSERTs into Postgres; standings
// are derived on read, so this route only refreshes stored facts — it never
// computes or stores points. Safe to run repeatedly (all writes are idempotent).
//
// Triggered by Vercel Cron (see vercel.json). Vercel attaches
// `Authorization: Bearer <CRON_SECRET>`; we reject anything else so the endpoint
// can't be poked by the public.

import { NextResponse } from "next/server";
import { initSchema, upsertMatch, replaceScorers, upsertFixtureCards, getCardFixtureIds } from "@/lib/db";
import { fetchMatches, fetchScorers } from "@/lib/providers/football-data";
import { fetchWorldCupFixtures, fetchFixtureCards, isCardRelevant } from "@/lib/providers/api-football";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WC_SEASON = 2026;
// Stay well under api-football's ~100 req/day free cap: a bounded batch of
// card fetches per run, prioritising fixtures we don't have yet.
const MAX_CARD_FETCHES = 8;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // not configured yet → allow (e.g. first manual run)
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function winnerName(m: Awaited<ReturnType<typeof fetchMatches>>[number]): string | null {
  if (m.score.winner === "HOME_TEAM") return m.homeTeam.name;
  if (m.score.winner === "AWAY_TEAM") return m.awayTeam.name;
  return null; // draw / undecided
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const counts = { matches: 0, scorers: 0, cards: 0 };
  const errors: string[] = [];

  await initSchema();

  // 1 — matches (goals, bracket, England, winner)
  try {
    const matches = await fetchMatches();
    for (const m of matches) {
      await upsertMatch({
        id: m.id,
        stage: m.stage,
        status: m.status,
        utc_date: m.utcDate,
        home_team: m.homeTeam.name,
        away_team: m.awayTeam.name,
        home_goals: m.score.fullTime.home,
        away_goals: m.score.fullTime.away,
        winner: winnerName(m),
      });
    }
    counts.matches = matches.length;
  } catch (e) {
    errors.push(String(e));
  }

  // 2 — top scorers
  try {
    const scorers = await fetchScorers();
    await replaceScorers(
      scorers.map((s) => ({ player: s.player.name, team: s.team?.name ?? null, goals: s.goals ?? 0 })),
    );
    counts.scorers = scorers.length;
  } catch (e) {
    errors.push(String(e));
  }

  // 3 — cards (api-football), bounded batch
  try {
    const fixtures = await fetchWorldCupFixtures(WC_SEASON);
    const have = await getCardFixtureIds();
    const relevant = fixtures.filter((f) => isCardRelevant(f.fixture.status.short));
    // Prefer fixtures we've never recorded; then re-touch the rest as budget allows.
    const ordered = [
      ...relevant.filter((f) => !have.has(f.fixture.id)),
      ...relevant.filter((f) => have.has(f.fixture.id)),
    ].slice(0, MAX_CARD_FETCHES);

    for (const f of ordered) {
      const { yellow, red } = await fetchFixtureCards(f.fixture.id);
      await upsertFixtureCards(f.fixture.id, yellow, red, f.fixture.status.short);
      counts.cards++;
    }
  } catch (e) {
    errors.push(String(e));
  }

  return NextResponse.json({ ok: errors.length === 0, counts, errors });
}
