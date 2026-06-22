// football-data.org adapter — goals, scorers, fixtures, bracket progress.
// Free tier covers the World Cup (competition code "WC"); it does NOT return
// card/booking data, which is why cards come from api-football instead.
// Token is read at call time so the build never depends on it.

const BASE = "https://api.football-data.org/v4";
const COMPETITION = "WC";

function token(): string {
  const t = process.env.FOOTBALL_DATA_TOKEN;
  if (!t) throw new Error("FOOTBALL_DATA_TOKEN is not set");
  return t;
}

async function fd<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { "X-Auth-Token": token() },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`football-data ${path} → HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Subset of the match resource we rely on.
export type FdStage =
  | "GROUP_STAGE" | "LAST_16" | "QUARTER_FINALS"
  | "SEMI_FINALS" | "THIRD_PLACE" | "FINAL";

export interface FdMatch {
  id: number;
  stage: FdStage;
  status: "SCHEDULED" | "TIMED" | "IN_PLAY" | "PAUSED" | "FINISHED" | "POSTPONED" | "SUSPENDED" | "CANCELLED";
  utcDate: string;
  homeTeam: { id: number | null; name: string | null };
  awayTeam: { id: number | null; name: string | null };
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    fullTime: { home: number | null; away: number | null };
  };
}

export interface FdScorer {
  player: { id: number; name: string };
  team: { id: number; name: string };
  goals: number | null;
}

export async function fetchMatches(): Promise<FdMatch[]> {
  const data = await fd<{ matches: FdMatch[] }>(`/competitions/${COMPETITION}/matches`);
  return data.matches ?? [];
}

export async function fetchScorers(): Promise<FdScorer[]> {
  const data = await fd<{ scorers: FdScorer[] }>(`/competitions/${COMPETITION}/scorers?limit=20`);
  return data.scorers ?? [];
}
