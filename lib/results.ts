// Derive the scoring Results object from stored tournament data.
// Goals/winner/bracket/England come from `matches`; the golden boot from
// `scorers`; the card tally from `fixture_cards` (or a manual override).
// Everything is computed from stored rows so it's always consistent with what
// ingestion last wrote.

import { getMatches, getScorers, getTotalCards, getManualCards, type MatchRow } from "./db";
import type { Results } from "./scoring";

const STAGE_ORDER: Record<string, number> = {
  GROUP_STAGE: 0, LAST_16: 1, QUARTER_FINALS: 2, SEMI_FINALS: 3, THIRD_PLACE: 3, FINAL: 4,
};
const STAGE_LABEL: Record<string, string> = {
  GROUP_STAGE: "Group Stage", LAST_16: "Last 16", QUARTER_FINALS: "Quarters",
  SEMI_FINALS: "Semi", FINAL: "Final",
};
const QF_PLUS = new Set(["QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"]);

const isEngland = (t: string | null) => !!t && t.toLowerCase().includes("england");
const isFinished = (m: MatchRow) => m.status === "FINISHED";

function englandExit(matches: MatchRow[]): string | null {
  const eng = matches.filter((m) => isEngland(m.home_team) || isEngland(m.away_team));
  const done = eng.filter(isFinished);
  if (!done.length) return null;

  const furthest = [...done].sort((a, b) => STAGE_ORDER[b.stage] - STAGE_ORDER[a.stage])[0];
  const wonFurthest = !!furthest.winner && isEngland(furthest.winner);

  if (furthest.stage === "FINAL") return wonFurthest ? "Winners" : "Final";
  if (furthest.stage !== "GROUP_STAGE") {
    return wonFurthest ? null : STAGE_LABEL[furthest.stage];
  }
  const group = eng.filter((m) => m.stage === "GROUP_STAGE");
  const allDone = group.length >= 3 && group.every(isFinished);
  return allDone ? "Group Stage" : null;
}

// Pure derivation from already-fetched rows.
export function deriveResults(
  matches: MatchRow[],
  scorers: { player: string; goals: number }[],
  cards: number | null,
): Results {
  const done = matches.filter(isFinished);
  const goals = done.length
    ? done.reduce((t, m) => t + (m.home_goals ?? 0) + (m.away_goals ?? 0), 0)
    : null;

  const finalMatch = matches.find((m) => m.stage === "FINAL" && isFinished(m));
  const winner = finalMatch?.winner ?? null;

  const darkHorseQF = Array.from(
    new Set(
      matches
        .filter((m) => QF_PLUS.has(m.stage))
        .flatMap((m) => [m.home_team, m.away_team])
        .filter((t): t is string => !!t),
    ),
  );

  return {
    winner,
    topScorer: scorers[0]?.player ?? null,
    englandExit: englandExit(matches),
    goals,
    cards,
    darkHorseQF,
  };
}

export async function computeResults(): Promise<Results> {
  const [matches, scorers, cards, manual] = await Promise.all([
    getMatches(), getScorers(), getTotalCards(), getManualCards(),
  ]);
  return deriveResults(matches, scorers, manual ?? cards);
}

export interface FeedMatch {
  stage: string;
  home: string | null;
  away: string | null;
  hg: number | null;
  ag: number | null;
  date: string | null;
}

export interface Dashboard {
  results: Results;
  recent: FeedMatch[];
  finishedCount: number;
  totalMatches: number;
  topScorerGoals: number | null;
}

// One-pass fetch for the dashboard page: results + a recent-results feed.
export async function getDashboard(): Promise<Dashboard> {
  const [matches, scorers, cards, manual] = await Promise.all([
    getMatches(), getScorers(), getTotalCards(), getManualCards(),
  ]);
  const results = deriveResults(matches, scorers, manual ?? cards);
  const finished = matches.filter(isFinished);
  const recent: FeedMatch[] = [...finished]
    .filter((m) => m.utc_date)
    .sort((a, b) => new Date(b.utc_date!).getTime() - new Date(a.utc_date!).getTime())
    .slice(0, 8)
    .map((m) => ({
      stage: m.stage, home: m.home_team, away: m.away_team,
      hg: m.home_goals, ag: m.away_goals, date: m.utc_date,
    }));
  return {
    results, recent,
    finishedCount: finished.length,
    totalMatches: matches.length,
    topScorerGoals: scorers[0]?.goals ?? null,
  };
}
