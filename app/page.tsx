// Server-rendered dashboard. Computes the authoritative standings on the server
// (no client-side scoring) and renders them. Falls back to a setup card when the
// backend isn't provisioned yet, so the preview deploy still loads.

import { PEOPLE, ALL_PLAYERS, type Player } from "@/lib/pool";
import { standings, type Standing, type Results } from "@/lib/scoring";
import { computeResults } from "@/lib/results";

export const dynamic = "force-dynamic";

const CATS = ["Winner", "Top scorer", "England exit", "Goals", "Cards", "Dark horse"] as const;
const TONE_BG: Record<string, string> = { red: "#f6c9c5", blue: "#cfe0f4", green: "#cfe8d4", gold: "#ffe6b0" };

function ResultsBar({ r }: { r: Results }) {
  const pending = (v: string | number | null): React.ReactNode =>
    v == null ? <span style={{ color: "var(--ink-2)" }}>pending</span> : String(v);
  const items: [string, React.ReactNode][] = [
    ["Winner", pending(r.winner)],
    ["Top scorer", pending(r.topScorer)],
    ["England", pending(r.englandExit)],
    ["Goals", pending(r.goals)],
    ["Cards", pending(r.cards)],
    ["QF+ teams", r.darkHorseQF.length ? r.darkHorseQF.join(", ") : pending(null)],
  ];
  return (
    <div className="panel gold" style={{ padding: "14px 16px", marginBottom: 26 }}>
      <div className="legend" style={{ padding: 0, gap: 22 }}>
        {items.map(([k, v]) => (
          <span key={k}><b style={{ fontFamily: "var(--anton)", textTransform: "uppercase" }}>{k}:</b>&nbsp;{v}</span>
        ))}
      </div>
    </div>
  );
}

function Podium({ table }: { table: Standing[] }) {
  const find = (n: string) => ALL_PLAYERS.find((p) => p.name === n) as Player | undefined;
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
            <div className="av lg" style={{ margin: "8px auto", background: TONE_BG[find(row!.name)?.tone ?? ""] }}>
              {find(row!.name)?.init ?? row!.name.slice(0, 2).toUpperCase()}
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
  const find = (n: string) => ALL_PLAYERS.find((p) => p.name === n);
  const max = Math.max(1, ...table.map((r) => r.pts));
  return (
    <div className="panel" style={{ marginTop: 26, overflowX: "auto" }}>
      <table className="chart">
        <thead>
          <tr>
            <th className="cat">#</th>
            <th className="cat" style={{ position: "static" }}>Player</th>
            {CATS.map((c) => <th key={c}>{c}</th>)}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {table.map((r) => (
            <tr key={r.name} className={r.name === "Rick" ? "total" : undefined}>
              <td className="cat">{r.rank}</td>
              <td className="cat" style={{ position: "static" }}>
                <span className="av sm" style={{ display: "inline-flex", marginRight: 8, background: TONE_BG[find(r.name)?.tone ?? ""] }}>
                  {find(r.name)?.init}
                </span>
                {r.name}
              </td>
              {CATS.map((c) => (
                <td key={c} style={{ fontWeight: r.breakdown[c] ? 700 : 400, color: r.breakdown[c] ? "var(--ink)" : "var(--ink-2)" }}>
                  {r.breakdown[c]}
                </td>
              ))}
              <td className="pt" style={{ fontFamily: "var(--anton)", fontSize: 22 }}>{r.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SetupCard({ message }: { message: string }) {
  return (
    <div className="panel red" style={{ padding: 24, marginTop: 26 }}>
      <h2 style={{ fontFamily: "var(--anton)", textTransform: "uppercase", marginTop: 0 }}>Backend not ready</h2>
      <p style={{ fontWeight: 500 }}>
        The standings couldn&apos;t be computed yet — the database or providers aren&apos;t provisioned.
        Set <code>DATABASE_URL</code>, <code>FOOTBALL_DATA_TOKEN</code> and <code>API_FOOTBALL_KEY</code>,
        then hit <code>/api/cron/ingest</code> once to load data.
      </p>
      <pre style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>{message}</pre>
    </div>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const { all } = await searchParams;
  const players = all ? ALL_PLAYERS : PEOPLE;

  let body: React.ReactNode;
  try {
    const results = await computeResults();
    const table = standings(players, results);
    body = (
      <>
        <ResultsBar r={results} />
        <Podium table={table} />
        <Leaderboard table={table} />
      </>
    );
  } catch (e) {
    body = <SetupCard message={String(e)} />;
  }

  return (
    <div className="stage">
      <header className="banner">
        <div className="banner__loz lozenge">
          <div className="banner__inner">
            <div className="banner__mark">
              <div>
                <div className="banner__word">Sweeper</div>
                <div className="banner__tag">World Cup Sweepstake · 2026 · Live standings</div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <section className="wrap" style={{ paddingTop: 28 }}>
        <div className="shead gold">
          <h2>The Table</h2>
          <span className="rule" />
        </div>
        {body}
      </section>
    </div>
  );
}
