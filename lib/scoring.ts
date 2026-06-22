// Sweepstake scoring engine (server-side, authoritative).
// Pure functions over PICKS (lib/pool) + a Results object (lib/results).
//
// Rules:
//   Winner       10 pts if correct
//   Top scorer    7 pts if correct
//   England exit  6 pts exact round · 3 pts correct half
//                 (early = Group Stage/R16 · late = QF/SF/Final/Winners)
//   Goals         5 pts to the closest guess, −1 per 5 goals of error (min 0)
//   Cards         3 pts to the closest guess, −1 per 5 cards of error (min 0)
//   Dark horse    5 pts if the chosen team reaches QF or beyond
// Closest-guess ties: tied players each receive the full base points.
// A category whose result isn't known yet scores 0 for everyone (pending).

import { PICKS, type Player } from "./pool";

export interface Results {
  winner: string | null;       // team that lifts the trophy
  topScorer: string | null;    // golden boot (full player name)
  englandExit: string | null;  // round England went out, or "Winners"
  goals: number | null;        // final tournament goal tally
  cards: number | null;        // final tournament card tally (yellow + red)
  darkHorseQF: string[];       // teams that reached QF or beyond
}

export type Breakdown = Record<string, number>;

export interface Standing {
  name: string;
  pts: number;
  rank: number;
  breakdown: Breakdown;
}

// England exit: round → tournament half.
const HALF: Record<string, "early" | "late"> = {
  "Group Stage": "early", "Group": "early", "Last 16": "early", "R16": "early",
  "Quarters": "late", "QF": "late", "Semi": "late", "SF": "late",
  "Final": "late", "Winners": "late",
};
const roundOf = (s: string) =>
  ({ R16: "Last 16", QF: "Quarters", SF: "Semi" } as Record<string, string>)[s] || s;

// Case-insensitive containment, so a pick ("Mbappé") matches a full name
// ("Kylian Mbappé") and vice-versa.
const nameMatch = (a: string, b: string) => {
  const x = a.toLowerCase(), y = b.toLowerCase();
  return x.includes(y) || y.includes(x);
};

function winner(pick: string | undefined, r: Results): number {
  return pick && r.winner && nameMatch(pick, r.winner) ? 10 : 0;
}

function topScorer(pick: string | undefined, r: Results): number {
  return pick && r.topScorer && nameMatch(pick, r.topScorer) ? 7 : 0;
}

function england(pick: string | undefined, r: Results): number {
  if (!pick || !r.englandExit) return 0;
  const p = roundOf(pick), actual = roundOf(r.englandExit);
  if (p === actual) return 6; // exact round
  if (HALF[p] && HALF[p] === HALF[actual]) return 3; // correct half
  return 0;
}

function darkHorse(pick: string | undefined, r: Results): number {
  if (!pick) return 0;
  // A pick may name more than one team ("Norway/Japan"); any qualifier counts.
  const teams = pick.split("/").map((t) => t.trim());
  return teams.some((t) => r.darkHorseQF.some((q) => nameMatch(t, q))) ? 5 : 0;
}

// Closest-guess scoring across the active players. base 5 (goals) / 3 (cards);
// −1 per 5 of absolute error, floored at 0. Only the closest scores; exact ties
// each receive the full base.
function closest(
  cat: "Goals" | "Cards",
  playerName: string,
  base: number,
  actual: number | null,
  active: string[],
): number {
  if (actual == null) return 0; // not settled yet
  const guesses = active
    .filter((n) => PICKS[cat][n] != null)
    .map((n) => ({ n, d: Math.abs(parseInt(PICKS[cat][n], 10) - actual) }));
  if (!guesses.length) return 0;
  const min = Math.min(...guesses.map((g) => g.d));
  const me = guesses.find((g) => g.n === playerName);
  if (!me || me.d !== min) return 0; // not the closest
  const tied = guesses.filter((g) => g.d === min).length > 1;
  if (tied) return base; // tie → both full
  return Math.max(0, base - Math.floor(me.d / 5));
}

export function breakdown(name: string, active: string[], r: Results): Breakdown {
  return {
    "Winner": winner(PICKS["Winner"][name], r),
    "Top scorer": topScorer(PICKS["Top scorer"][name], r),
    "England exit": england(PICKS["England exit"][name], r),
    "Goals": closest("Goals", name, 5, r.goals, active),
    "Cards": closest("Cards", name, 3, r.cards, active),
    "Dark horse": darkHorse(PICKS["Dark horse"][name], r),
  };
}

export function total(name: string, active: string[], r: Results): number {
  const b = breakdown(name, active, r);
  return Object.keys(b).reduce((s, k) => s + b[k], 0);
}

// standings(players, results) → ranked array, best first.
export function standings(players: Player[], r: Results): Standing[] {
  const active = players.map((p) => p.name);
  const rows = players.map((p) => {
    const b = breakdown(p.name, active, r);
    return { name: p.name, breakdown: b, pts: Object.keys(b).reduce((s, k) => s + b[k], 0) };
  });
  rows.sort((a, b) => b.pts - a.pts || a.name.localeCompare(b.name));
  return rows.map((row, i) => ({ ...row, rank: i + 1 }));
}
