// The sweepstake pool: who's in it and what they predicted.
// Picks are static config (entered once, locked for the tournament); the live
// tournament data that scores them comes from the providers + DB.

export type Tone = "red" | "blue" | "green" | "gold";

export interface Player {
  name: string;
  init: string;
  tone: Tone;
}

export const PEOPLE: Player[] = [
  { name: "Angus", init: "AN", tone: "red" },
  { name: "Tim", init: "TI", tone: "blue" },
  { name: "Hugo", init: "HU", tone: "green" },
  { name: "Tony", init: "TO", tone: "gold" },
  { name: "Rick", init: "RI", tone: "red" },
  { name: "Josh", init: "JO", tone: "gold" },
];

export const ALL_PLAYERS = PEOPLE;

export type Category =
  | "Winner"
  | "Top scorer"
  | "England exit"
  | "Goals"
  | "Cards"
  | "Dark horse";

// Each player's call per scored category. Goals/Cards are numeric strings.
export const PICKS: Record<Category, Record<string, string>> = {
  "Winner": {
    Angus: "Spain", Tim: "England", Hugo: "Spain", Tony: "France",
    Rick: "France", Josh: "France",
  },
  "Top scorer": {
    Angus: "Mbappé", Tim: "Kane", Hugo: "Mbappé", Tony: "Oyarzabal",
    Rick: "Mbappé", Josh: "Kane",
  },
  "England exit": {
    Angus: "Last 16", Tim: "Winners", Hugo: "Semi", Tony: "Final",
    Rick: "Semi", Josh: "Final",
  },
  "Goals": {
    Angus: "166", Tim: "264", Hugo: "150", Tony: "317",
    Rick: "184", Josh: "250",
  },
  "Cards": {
    Angus: "250", Tim: "368", Hugo: "200", Tony: "489",
    Rick: "204", Josh: "400",
  },
  "Dark horse": {
    Angus: "Morocco", Tim: "Ecuador", Hugo: "Norway", Tony: "Japan",
    Rick: "Norway/Japan", Josh: "Mexico",
  },
};

// Non-scored fun board, kept for the UI.
export const MAD_SHIT: Record<string, string> = {
  Angus: "Cape Verde win a game · someone shits themself on the pitch",
  Tim: "England draw Brazil in the KO & beat them comfortably",
  Hugo: "African team in the semi · Ronaldo scores a hat-trick at 40",
  Tony: "Hincapié's bottom is seen again",
  Rick: "I watch more than 5 matches",
  Josh: "Trump invades the pitch to lift the trophy himself · MAGA hats distributed in the winners' dressing room",
};
