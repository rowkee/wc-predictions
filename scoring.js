/* Sweeper — sweepstake scoring engine.
   Pure functions over window.WC.grid (picks) + window.WC.results (settled
   outcome). Attaches to window.Scoring. No framework dependency.

   Rules:
     Winner       10 pts if correct
     Top scorer    7 pts if correct
     England exit  6 pts exact round · 3 pts correct half
                   (early = Group Stage/R16 · late = QF/SF/Final/Winners)
     Goals         5 pts to the closest guess, −1 per 5 goals of error (min 0)
     Cards         3 pts to the closest guess, −1 per 5 cards of error (min 0)
     Dark horse    5 pts if the chosen team reaches QF or beyond
   Closest-guess ties: tied players each receive the full base points. */
(function () {
  const WC = window.WC;
  const R = WC.results;
  const cat = (name) => WC.grid.find((g) => g.cat === name);

  // England exit: round → tournament half.
  const HALF = {
    "Group Stage": "early", "Group": "early", "Last 16": "early", "R16": "early",
    "Quarters": "late", "QF": "late", "Semi": "late", "SF": "late",
    "Final": "late", "Winners": "late",
  };
  // Normalise the short labels used in some picks to their canonical round.
  const round = (s) => ({ R16: "Last 16", QF: "Quarters", SF: "Semi" }[s] || s);

  function winner(pick) { return pick && pick.v === R.winner ? 10 : 0; }
  function topScorer(pick) { return pick && pick.v === R.topScorer ? 7 : 0; }

  function england(pick) {
    if (!pick) return 0;
    const p = round(pick.v), actual = round(R.englandExit);
    if (p === actual) return 6;                          // exact round
    if (HALF[p] && HALF[p] === HALF[actual]) return 3;   // correct half
    return 0;
  }

  function darkHorse(pick) {
    if (!pick) return 0;
    // A pick may name more than one team ("Norway/Japan"); any qualifier counts.
    const teams = String(pick.v).split("/").map((t) => t.trim());
    return teams.some((t) => R.darkHorseQF.includes(t)) ? 5 : 0;
  }

  // Closest-guess scoring across the currently active players.
  // base 5 (goals) / 3 (cards); −1 per 5 of absolute error, floored at 0.
  // Only the closest scores; exact ties each receive the full base.
  function closest(catName, playerName, base, actual, active) {
    const guesses = Object.entries(cat(catName).picks)
      .filter(([n]) => active.includes(n))
      .map(([n, pk]) => ({ n, d: Math.abs(parseInt(pk.v, 10) - actual) }));
    const min = Math.min.apply(null, guesses.map((g) => g.d));
    const me = guesses.find((g) => g.n === playerName);
    if (!me || me.d !== min) return 0;                   // not the closest
    const tied = guesses.filter((g) => g.d === min).length > 1;
    if (tied) return base;                               // tie → both full
    return Math.max(0, base - Math.floor(me.d / 5));     // sole closest, scaled by error
  }

  const namesOf = (people) => people.map((p) => p.name);
  const DEFAULT = WC.people;

  // Per-category points for one player. `active` decides the closest-guess pool.
  function breakdown(name, active) {
    active = active || namesOf(DEFAULT);
    const g = (c) => cat(c).picks[name];
    return {
      "Winner": winner(g("Winner")),
      "Top scorer": topScorer(g("Top scorer")),
      "England exit": england(g("England exit")),
      "Goals": closest("Goals", name, 5, R.goals, active),
      "Cards": closest("Cards", name, 3, R.cards, active),
      "Dark horse": darkHorse(g("Dark horse")),
    };
  }

  function total(name, active) {
    const b = breakdown(name, active);
    return Object.keys(b).reduce((s, k) => s + b[k], 0);
  }

  // standings(people) → array sorted best-first, each:
  //   { name, pts, rank, move, breakdown }
  // `move` is the rise/fall versus the provisional WC.table ranking.
  function standings(people) {
    const active = namesOf(people);
    const prov = {};
    (people.length > 5 ? WC.table7 : WC.table).forEach((r) => { prov[r.name] = r.rank; });
    const rows = people.map((p) => {
      const b = breakdown(p.name, active);
      return { name: p.name, breakdown: b, pts: Object.keys(b).reduce((s, k) => s + b[k], 0) };
    });
    rows.sort((a, b) => b.pts - a.pts || a.name.localeCompare(b.name));
    rows.forEach((r, i) => { r.rank = i + 1; r.move = (prov[r.name] || r.rank) - r.rank; });
    return rows;
  }

  window.Scoring = { standings, total, breakdown, winner, topScorer, england, darkHorse, closest };
})();
