/* Mock live state for the World Cup pool wireframes.
   Tournament moment: SEMI-FINALS, live. Closest-guess categories show
   provisional points; binary categories show alive/leading/hit/miss. */
window.WC = {
  live: { stage: "Semi-finals", day: "Day 26", goals: 198, cards: 322, time: "20:41" },

  // Settled tournament results — the source of truth the scoring engine reads.
  // Edit these as the tournament resolves; standings recompute automatically.
  results: {
    winner: "France",          // lifts the trophy
    topScorer: "Mbappé",       // golden boot
    englandExit: "Semi",       // round England actually went out
    goals: 205,                // final tournament goal tally
    cards: 355,                // final tournament card tally
    darkHorseQF: ["Spain", "France", "England", "Brazil", "Morocco", "Japan"], // teams that reached QF or beyond
  },

  people: [
    { name: "Angus", init: "AN", tone: "red" },
    { name: "Tim",   init: "TI", tone: "blue" },
    { name: "Hugo",  init: "HU", tone: "green" },
    { name: "Tony",  init: "TO", tone: "gold" },
    { name: "Rick",  init: "RI", tone: "red" },
    { name: "Josh",  init: "JO", tone: "gold" },
  ],

  // Scoring legend (for the key)
  legend: [
    { s: "hit",     label: "Banked" },
    { s: "lead",    label: "On track" },
    { s: "live",    label: "Still alive" },
    { s: "miss",    label: "Gone" },
  ],

  // Live standings — provisional points (Goals/Cards ranked 10/8/4/1/0;
  // Winner/Scorer/DarkHorse/England-exit = 10 if right; mad shit unscored).
  table: [
    { name: "Angus", pts: 36, move: 0,  rank: 1 },
    { name: "Rick",  pts: 34, move: 1,  rank: 2 },
    { name: "Hugo",  pts: 15, move: 0,  rank: 3 },
    { name: "Tim",   pts: 11, move: -1, rank: 4 },
    { name: "Tony",  pts: 10, move: -1, rank: 5 },
    { name: "Josh",  pts: 0,  move: 0,  rank: 6 },
  ],

  // The prediction wallchart. type: binary | closest | display
  // pick = the call; s = status; p = provisional points (when relevant)
  grid: [
    {
      cat: "Winner", short: "WIN", type: "binary",
      picks: {
        Angus: { v: "Spain",   s: "live" }, Tim:  { v: "England", s: "live" },
        Hugo:  { v: "Spain",   s: "live" }, Tony: { v: "France",  s: "live" },
        Rick:  { v: "France",  s: "live" }, Josh: { v: "France",  s: "live" },
      },
    },
    {
      cat: "Goals", short: "GLS", type: "closest", live: "198 so far",
      picks: {
        Angus: { v: "166", s: "lead", p: 8  }, Tim:  { v: "264", s: "live", p: 1  },
        Hugo:  { v: "150", s: "live", p: 4  }, Tony: { v: "317", s: "miss", p: 0  },
        Rick:  { v: "184", s: "lead", p: 10 }, Josh: { v: "250", s: "live", p: 0  },
      },
    },
    {
      cat: "Cards", short: "CRD", type: "closest", live: "322 so far",
      picks: {
        Angus: { v: "250", s: "lead", p: 8  }, Tim:  { v: "368", s: "lead", p: 10 },
        Hugo:  { v: "200", s: "live", p: 1  }, Tony: { v: "489", s: "miss", p: 0  },
        Rick:  { v: "204", s: "live", p: 4  }, Josh: { v: "400", s: "live", p: 0  },
      },
    },
    {
      cat: "Top scorer", short: "TOP", type: "binary",
      picks: {
        Angus: { v: "Mbappé",  s: "lead" }, Tim:  { v: "Kane",      s: "miss" },
        Hugo:  { v: "Mbappé",  s: "lead" }, Tony: { v: "Oyarzabal", s: "miss" },
        Rick:  { v: "Mbappé",  s: "lead" }, Josh: { v: "Kane",      s: "miss" },
      },
    },
    {
      cat: "Dark horse", short: "DKH", type: "binary",
      picks: {
        Angus: { v: "Morocco",      s: "hit"  }, Tim:  { v: "Ecuador", s: "miss" },
        Hugo:  { v: "Norway",       s: "miss" }, Tony: { v: "Japan",   s: "hit"  },
        Rick:  { v: "Norway/Japan", s: "hit"  }, Josh: { v: "Mexico",  s: "miss" },
      },
    },
    {
      cat: "England exit", short: "ENG", type: "binary",
      picks: {
        Angus: { v: "Last 16", s: "miss" }, Tim:  { v: "Winners", s: "live" },
        Hugo:  { v: "Semi",    s: "live" }, Tony: { v: "Final",   s: "live" },
        Rick:  { v: "Semi",    s: "live" }, Josh: { v: "Final",   s: "live" },
      },
    },
    {
      cat: "Notable mad shit", short: "MAD", type: "display",
      picks: {
        Angus: { v: "Cape Verde win a game · someone shits themself on the pitch" },
        Tim:   { v: "England draw Brazil in the KO & beat them comfortably · clear audio of Trump shitting his pants" },
        Hugo:  { v: "African team in the semi · Ronaldo scores a hat-trick at 40" },
        Tony:  { v: "Hincapié's bottom is seen again" },
        Rick:  { v: "I watch more than 5 matches" },
        Josh:  { v: "Trump invades the pitch to lift the trophy himself · MAGA hats distributed in the winners' dressing room" },
      },
    },
  ],

  // "What changed today" feed
  feed: [
    { tag: "GOAL",       tone: "blue",  time: "20:38", text: "Spain 2 – 1 France · Semi-final, 71'" },
    { tag: "Goals",      tone: "gold",  time: "20:38", text: "Tally ticks to 198 — Rick's 184 is still the closest call (+10 prov.)" },
    { tag: "Top scorer", tone: "red",   time: "19:55", text: "Mbappé makes it 12 — Angus, Hugo & Rick all still on it" },
    { tag: "Dark horse", tone: "green", time: "18:10", text: "Japan's run ends in the QF — Tony & Rick bank the dark horse (+10)" },
    { tag: "England",    tone: "ink",   time: "Yesterday", text: "England into the semis — exit calls live for Tim, Hugo, Tony, Rick" },
    { tag: "Cards",      tone: "gold",  time: "Yesterday", text: "Card tally 322 — Tim's 368 out in front, Angus second" },
  ],
};
