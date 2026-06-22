// Neon Postgres access + schema.
//
// Design note on idempotency: ingestion runs on a schedule and can overlap or
// retry, so nothing is ever incremented. Each match / fixture row is keyed by
// its provider id and UPSERTed (overwrite), and tournament totals are derived
// with SUM() over those rows. Re-polling the same match is therefore harmless.

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

export function db(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  _sql = neon(url);
  return _sql;
}

export async function initSchema(): Promise<void> {
  const sql = db();
  // Matches from football-data.org → goals, bracket, England exit, winner.
  await sql`
    CREATE TABLE IF NOT EXISTS matches (
      id          BIGINT PRIMARY KEY,
      stage       TEXT NOT NULL,
      status      TEXT NOT NULL,
      utc_date    TIMESTAMPTZ,
      home_team   TEXT,
      away_team   TEXT,
      home_goals  INT,
      away_goals  INT,
      winner      TEXT,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  // Top-scorer snapshot from football-data.org (small; replaced each run).
  await sql`
    CREATE TABLE IF NOT EXISTS scorers (
      player      TEXT PRIMARY KEY,
      team        TEXT,
      goals       INT NOT NULL,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  // Per-fixture card totals from api-football, keyed by its fixture id.
  await sql`
    CREATE TABLE IF NOT EXISTS fixture_cards (
      fixture_id  BIGINT PRIMARY KEY,
      yellow      INT NOT NULL DEFAULT 0,
      red         INT NOT NULL DEFAULT 0,
      status      TEXT,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
}

export interface MatchRow {
  id: number;
  stage: string;
  status: string;
  utc_date: string | null;
  home_team: string | null;
  away_team: string | null;
  home_goals: number | null;
  away_goals: number | null;
  winner: string | null;
}

export async function upsertMatch(m: MatchRow): Promise<void> {
  const sql = db();
  await sql`
    INSERT INTO matches (id, stage, status, utc_date, home_team, away_team, home_goals, away_goals, winner, updated_at)
    VALUES (${m.id}, ${m.stage}, ${m.status}, ${m.utc_date}, ${m.home_team}, ${m.away_team},
            ${m.home_goals}, ${m.away_goals}, ${m.winner}, now())
    ON CONFLICT (id) DO UPDATE SET
      stage = EXCLUDED.stage, status = EXCLUDED.status, utc_date = EXCLUDED.utc_date,
      home_team = EXCLUDED.home_team, away_team = EXCLUDED.away_team,
      home_goals = EXCLUDED.home_goals, away_goals = EXCLUDED.away_goals,
      winner = EXCLUDED.winner, updated_at = now()`;
}

export async function replaceScorers(rows: { player: string; team: string | null; goals: number }[]): Promise<void> {
  const sql = db();
  await sql`DELETE FROM scorers`;
  for (const r of rows) {
    await sql`INSERT INTO scorers (player, team, goals, updated_at)
              VALUES (${r.player}, ${r.team}, ${r.goals}, now())
              ON CONFLICT (player) DO UPDATE SET team = EXCLUDED.team, goals = EXCLUDED.goals, updated_at = now()`;
  }
}

export async function upsertFixtureCards(
  fixtureId: number, yellow: number, red: number, status: string,
): Promise<void> {
  const sql = db();
  await sql`
    INSERT INTO fixture_cards (fixture_id, yellow, red, status, updated_at)
    VALUES (${fixtureId}, ${yellow}, ${red}, ${status}, now())
    ON CONFLICT (fixture_id) DO UPDATE SET
      yellow = EXCLUDED.yellow, red = EXCLUDED.red, status = EXCLUDED.status, updated_at = now()`;
}

export async function getMatches(): Promise<MatchRow[]> {
  const sql = db();
  return (await sql`SELECT * FROM matches`) as MatchRow[];
}

export async function getScorers(): Promise<{ player: string; team: string | null; goals: number }[]> {
  const sql = db();
  return (await sql`SELECT player, team, goals FROM scorers ORDER BY goals DESC`) as {
    player: string; team: string | null; goals: number;
  }[];
}

export async function getTotalCards(): Promise<number | null> {
  const sql = db();
  const rows = (await sql`SELECT COALESCE(SUM(yellow + red), 0)::int AS total FROM fixture_cards`) as { total: number }[];
  const haveAny = (await sql`SELECT count(*)::int AS n FROM fixture_cards`) as { n: number }[];
  return haveAny[0]?.n ? rows[0].total : null; // null = no card data yet
}

export async function getCardFixtureIds(): Promise<Set<number>> {
  const sql = db();
  const rows = (await sql`SELECT fixture_id FROM fixture_cards`) as { fixture_id: number }[];
  return new Set(rows.map((r) => r.fixture_id));
}
