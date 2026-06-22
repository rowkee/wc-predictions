// Derive the scoring Results object from stored tournament data.
// Goals/winner/bracket/England come from `matches`; the golden boot from
// `scorers`; the card tally from `fixture_cards`. Everything is computed from
// stored rows so it's always consistent with what ingestion last wrote.

import { getMatches, getScorers, getTotalCards, type MatchRow } from "./db";
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
const finished = (m: MatchRow) => m.status === "FINISHED";

function englandExit(matches: MatchRow[]): string | null {
  const eng = matches.filter((m) => isEngland(m.home_team) || isEngland(m.away_team));
  const done = eng.filter(finished);
  if (!done.length) return null;

  const furthest = [...done].sort((a, b) => STAGE_ORDER[b.stage] - STAGE_ORDER[a.stage])[0];
  const wonFurthest = !!furthest.winner && isEngland(furthest.winner);

  if (furthest.stage === "FINAL") return wonFurthest ? "Winners" : "Final";
  if (furthest.stage !== "GROUP_STAGE") {
    // Knockout: a loss is an exit; a win means they advanced — await the next round.
    return wonFurthest ? null : STAGE_LABEL[furthest.stage];
  }
  // Group-only: treat as a group-stage exit once all three group games are done.
  const group = eng.filter((m) => m.stage === "GROUP_STAGE");
  const allDone = group.length >= 3 && group.every(finished);
  return allDone ? "Group Stage" : null;
}

export async function computeResults(): Promise<Results> {
  const [matches, scorers, cards] = await Promise.all([
    getMatches(), getScorers(), getTotalCards(),
  ]);

  const done = matches.filter(finished);
  const goals = done.length
    ? done.reduce((t, m) => t + (m.home_goals ?? 0) + (m.away_goals ?? 0), 0)
    : null;

  const finalMatch = matches.find((m) => m.stage === "FINAL" && finished(m));
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
