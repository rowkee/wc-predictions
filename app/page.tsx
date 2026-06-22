// Server-rendered gaudy dashboard, computed from live tournament data.
// No client-side scoring: getDashboard() + standings() run on the server.

import { PEOPLE, ALL_PLAYERS, PICKS, MAD_SHIT, type Player } from "@/lib/pool";
import { standings, type Standing, type Results } from "@/lib/scoring";
import { getDashboard, type FeedMatch } from "@/lib/results";
import { Stein, Pretzel, Sausage, Ball, Garland } from "@/components/art";

export const dynamic = "force-dynamic";

const TONE_BG: Record<string, string> = { red: "#f6c9c5", blue: "#cfe0f4", green: "#cfe8d4", gold: "#ffe6b0" };
const WALL_CATS = ["Winner", "Goals", "Cards", "Top scorer", "Dark horse", "England exit"] as const;
const PROVISIONAL = new Set(["Top scorer", "Goals", "Cards"]);
const find = (n: string) => ALL_PLAYERS.find((p) => p.name === n) as Player | undefined;

const ABBR: Record<string, string> = {
  "Last 16": "L16", "Winners": "WIN", "Quarters": "QF", "Semi": "SF", "Final": "F",
  "Oyarzabal": "Oyar.", "Norway/Japan": "NOR/JP",
};
const abbr = (s: string) => ABBR[s] ?? (s.length > 7 ? s.slice(0, 6) + "…" : s);

const STAGE_SHORT: Record<string, string> = {
  GROUP_STAGE: "Group", LAST_16: "R16", QUARTER_FINALS: "QF",
  SEMI_FINALS: "SF", THIRD_PLACE: "3rd", FINAL: "Final",
};
const STAGE_TONE: Record<string, string> = {
  GROUP_STAGE: "blue", LAST_16: "gold", QUARTER_FINALS: "green",
  SEMI_FINALS: "red", THIRD_PLACE: "ink", FINAL: "red",
};

type Pip = "hit" | "lead" | "live" | "miss";
function pipFor(cat: string, pts: number, r: Results): Pip {
  if (pts > 0) return PROVISIONAL.has(cat) ? "lead" : "hit";
  const decided =
    cat === "Winner" ? r.winner != null :
    cat === "England exit" ? r.englandExit != null : false;
  return decided ? "miss" : "live";
}

function Avatar({ name, size }: { name: string; size?: "sm" | "lg" }) {
  const p = find(name);
  return (
    <span className={"av" + (size ? " " + size : "")} style={{ background: TONE_BG[p?.tone ?? ""] || "#eee" }}>
      {p?.init ?? name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function SectionHead({ color, icon, title, size }: { color: string; icon: React.ReactNode; title: string; size?: number }) {
  return (
    <div className={"shead " + color}>
      {icon}
      <h2 style={size ? { fontSize: size } : undefined}>{title}</h2>
      <span className="rule" />
    </div>
  );
}

function Banner({ d }: { d: { results: Results; finishedCount: number; totalMatches: number } }) {
  const r = d.results;
  return (
    <header className="banner">
      <div className="banner__loz lozenge">
        <div className="banner__inner">
          <div className="banner__mark">
            <Ball size={64} color="#fff" />
            <div>
              <div className="banner__word">Sweeper</div>
              <div className="banner__tag">World Cup Sweepstake · 2026 · Live</div>
            </div>
          </div>
          <div className="banner__live">
            <div className="k">Goals so far</div>
            <div className="v">{r.goals ?? "—"}</div>
            <div className="t">{d.finishedCount}/{d.totalMatches} played</div>
          </div>
        </div>
      </div>
      <Garland />
    </header>
  );
}

function Podium({ table }: { table: Standing[] }) {
  const [p1, p2, p3] = table;
  const order = [
    { row: p2, slot: "second", tag: "2nd", cls: "blue" },
    { row: p1, slot: "first", tag: "Champion", cls: "gold" },
    { row: p3, slot: "third", tag: "3rd", cls: "green" },
  ].filter((o) => o.row);
  return (
    <div className="podium">
      {order.map(({ row, slot, tag, cls }) => (
        <div key={row!.name} className={"panel " + cls}>
          <div className={"pcard " + slot}>
            <div className="ribbon">{tag}</div>
            {slot === "first" && (
              <div style={{ position: "absolute", top: -2, right: 8 }}><Stein size={46} rot={6} /></div>
            )}
            <div className="av lg" style={{ margin: "8px auto", background: TONE_BG[find(row!.name)?.tone ?? ""] }}>
              {find(row!.name)?.init}
            </div>
            <div className="nm">{row!.name}</div>
            <div className="pts">{row!.pts}<small>POINTS</small></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Leaderboard({ table }: { table: Standing[] }) {
  const max = Math.max(1, ...table.map((r) => r.pts));
  const barColor = ["var(--red)", "var(--blue)", "var(--green)", "var(--gold)"];
  return (
    <div className="panel" style={{ marginTop: 26 }}>
      <div className="lb">
        {table.map((r, i) => (
          <div key={r.name} className={"lbrow" + (r.name === "Rick" ? " me" : "")}>
            <span className="rk">{r.rank}</span>
            <Avatar name={r.name} size="sm" />
            <span className="nm">
              {r.name}
              {r.name === "Rick" && <span style={{ color: "var(--ink-2)", fontWeight: 600 }}> · you</span>}
            </span>
            <span className="bar" style={{ width: 120 * (r.pts / max), background: barColor[i % 4] }} />
            <span className="pts">{r.pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Wallchart({ players, table, results }: { players: Player[]; table: Standing[]; results: Results }) {
  const byName = Object.fromEntries(table.map((r) => [r.name, r]));
  return (
    <div className="panel blue">
      <div className="legend">
        <span><i className="pip hit" /> Banked</span>
        <span><i className="pip lead" /> On track</span>
        <span><i className="pip live" /> Alive</span>
        <span><i className="pip miss" /> Gone</span>
      </div>
      <table className="chart">
        <thead>
          <tr><th className="cat"> </th>{players.map((p) => <th key={p.name}>{p.init}</th>)}</tr>
        </thead>
        <tbody>
          {WALL_CATS.map((cat) => (
            <tr key={cat}>
              <td className="cat">{cat}</td>
              {players.map((p) => {
                const pick = PICKS[cat][p.name] ?? "—";
                const pts = byName[p.name]?.breakdown[cat] ?? 0;
                const pip = pipFor(cat, pts, results);
                const closest = cat === "Goals" || cat === "Cards";
                return (
                  <td key={p.name} className={pip}>
                    <span className="cell">
                      <i className={"pip " + pip} />
                      <span className="v">{closest ? pick : abbr(pick)}</span>
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="total">
            <td className="cat">Points</td>
            {players.map((p) => <td key={p.name} className="pt">{byName[p.name]?.pts ?? 0}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Feed({ recent }: { recent: FeedMatch[] }) {
  if (!recent.length) {
    return <div className="panel red feed"><div className="fitem"><div className="ftx">No finished matches yet.</div></div></div>;
  }
  return (
    <div className="panel red feed">
      {recent.map((m, i) => (
        <div key={i} className="fitem">
          <span className={"tag " + (STAGE_TONE[m.stage] ?? "ink")}>{STAGE_SHORT[m.stage] ?? m.stage}</span>
          <div className="fbody">
            <div className="ftx">{m.home} {m.hg}–{m.ag} {m.away}</div>
            <div className="ftime">
              {m.date ? new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MadBoard() {
  return (
    <div className="panel gold mad">
      {PEOPLE.map((p) => (
        <div key={p.name} className="mitem">
          <div className="who"><Avatar name={p.name} size="sm" /><b>{p.name}</b></div>
          <div className="q">“{MAD_SHIT[p.name]}”</div>
        </div>
      ))}
    </div>
  );
}

function SetupCard({ message }: { message: string }) {
  return (
    <section className="wrap" style={{ paddingTop: 28 }}>
      <div className="panel red" style={{ padding: 24 }}>
        <h2 style={{ fontFamily: "var(--anton)", textTransform: "uppercase", marginTop: 0 }}>Backend warming up</h2>
        <p style={{ fontWeight: 500 }}>Standings couldn&apos;t be computed yet. Once data is ingested this fills in automatically.</p>
        <pre style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>{message}</pre>
      </div>
    </section>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const { all } = await searchParams;
  const players = all ? ALL_PLAYERS : PEOPLE;

  let dash;
  try {
    dash = await getDashboard();
  } catch (e) {
    return (
      <div className="stage">
        <SetupCard message={String(e)} />
      </div>
    );
  }

  const table = standings(players, dash.results);

  return (
    <div className="stage">
      <Banner d={dash} />

      <section className="wrap">
        <SectionHead color="gold" icon={<Pretzel size={42} className="ic" />} title="The Table" />
        <Podium table={table} />
        <Leaderboard table={table} />
      </section>

      <section className="wrap" style={{ position: "relative" }}>
        <Sausage size={88} className="scatter" style={{ right: -18, top: 18, transform: "rotate(20deg)" }} />
        <SectionHead color="red" icon={<Sausage size={42} className="ic" />} title="The Wallchart" />
        <div className="cols">
          <Wallchart players={players} table={table} results={dash.results} />
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div>
              <SectionHead color="blue" icon={<Stein size={40} className="ic" />} title="Latest" size={30} />
              <Feed recent={dash.recent} />
            </div>
            <div>
              <SectionHead color="green" icon={<Pretzel size={40} className="ic" />} title="Mad Shit" size={26} />
              <MadBoard />
            </div>
          </div>
        </div>
      </section>

      <footer className="foot lozenge">
        <div className="foot__row">
          <Stein size={56} rot={-8} /><Sausage size={56} /><Stein size={56} rot={8} />
        </div>
        <div className="prost">Prost!</div>
        <div className="sub">Scores update live as results roll in.</div>
      </footer>
    </div>
  );
}
