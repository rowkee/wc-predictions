// API-Football adapter — CARDS ONLY (football-data.org doesn't expose bookings).
// Free plan: ~100 requests/day, so the cron fetches stats for a small batch of
// recent/in-play fixtures per run rather than the whole tournament every time.
// World Cup is league 1; the fixture-statistics endpoint returns per-team
// yellow/red counts, which we sum into a per-fixture total.

const BASE = "https://v3.football.api-sports.io";
const WORLD_CUP_LEAGUE = 1;

function key(): string {
  const k = process.env.API_FOOTBALL_KEY;
  if (!k) throw new Error("API_FOOTBALL_KEY is not set");
  return k;
}

async function af<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { "x-apisports-key": key() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`api-football ${path} → HTTP ${res.status}`);
  const json = (await res.json()) as { response: T; errors?: unknown };
  if (json.errors && Object.keys(json.errors).length) {
    throw new Error(`api-football ${path} → ${JSON.stringify(json.errors)}`);
  }
  return json.response;
}

export interface AfFixture {
  fixture: { id: number; status: { short: string }; date: string };
  teams: { home: { name: string }; away: { name: string } };
}

interface AfStatistic {
  type: string;
  value: number | string | null;
}
interface AfTeamStatistics {
  statistics: AfStatistic[];
}

export async function fetchWorldCupFixtures(season: number): Promise<AfFixture[]> {
  return af<AfFixture[]>(`/fixtures?league=${WORLD_CUP_LEAGUE}&season=${season}`);
}

// Per-fixture card totals (both teams combined).
export async function fetchFixtureCards(
  fixtureId: number,
): Promise<{ yellow: number; red: number }> {
  const teams = await af<AfTeamStatistics[]>(`/fixtures/statistics?fixture=${fixtureId}`);
  let yellow = 0, red = 0;
  for (const team of teams) {
    for (const s of team.statistics ?? []) {
      const v = typeof s.value === "number" ? s.value : Number(s.value) || 0;
      if (s.type === "Yellow Cards") yellow += v;
      if (s.type === "Red Cards") red += v;
    }
  }
  return { yellow, red };
}

// A fixture is worth (re)fetching cards for once it's underway or done.
export function isCardRelevant(status: string): boolean {
  return ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "FT", "AET", "PEN"].includes(status);
}
