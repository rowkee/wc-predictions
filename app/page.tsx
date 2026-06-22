// Server-rendered dashboard (re-synced design): live-value cards computed from
// real tournament data, plus the full predictions table. Scoring still runs
// server-side and is available at /api/standings; this view focuses on the
// live state + everyone's calls.

import { PEOPLE, ALL_PLAYERS, PICKS, MAD_SHIT, type Player } from "@/lib/pool";
import { getDashboard, type Dashboard } from "@/lib/results";
import { Stein, Pretzel, Sausage, Ball, Garland } from "@/components/art";

export const dynamic = "force-dynamic";

const TONE_BG: Record<string, string> = { red: "#f6c9c5", blue: "#cfe0f4", green: "#cfe8d4", gold: "#ffe6b0" };
const WALL_CATS = ["Winner", "Goals", "Cards", "Top scorer", "Dark horse", "England exit"] as const;

function SectionHead({ color, icon, title }: { color: string; icon: React.ReactNode; title: string }) {
  return (
    <div className={"shead " + color}>
      {icon}
      <h2>{title}</h2>
      <span className="rule" />
    </div>
  );
}

function Banner({ d }: { d: Dashboard }) {
  return (
    <header className="banner">
      <div className="banner__loz lozenge">
        <div className="banner__inner">
          <div className="banner__mark">
            <img
              src="/sweeper-icon.png"
              alt="Sweeper"
              width={64}
              height={64}
              style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--ink)", background: "#fff", flex: "0 0 auto" }}
            />
            <div>
              <div className="banner__word">Sweeper</div>
              <div className="banner__tag">World Cup Sweepstake · 2026 · Live</div>
            </div>
          </div>
          <div className="banner__live">
            <div className="k">Goals so far</div>
            <div className="v">{d.results.goals ?? "—"}</div>
            <div className="t">{d.finishedCount}/{d.totalMatches} played</div>
          </div>
        </div>
      </div>
      <Garland />
    </header>
  );
}

// 6 live-value cards, each reading the authoritative computed result.
function LiveValues({ d }: { d: Dashboard }) {
  const r = d.results;
  const dh = r.darkHorseQF.length ? r.darkHorseQF.slice(0, 3).join(" · ") : "TBD";
  const cards: { cat: string; tone: string; Icon: typeof Ball; value: React.ReactNode; note: string }[] = [
    { cat: "Winner", tone: "blue", Icon: Ball, value: r.winner ?? "TBD", note: r.winner ? "champions" : "still to be decided" },
    { cat: "Goals", tone: "blue", Icon: Pretzel, value: r.goals ?? "—", note: "and counting" },
    { cat: "Cards", tone: "blue", Icon: Sausage, value: r.cards ?? "—", note: r.cards != null ? "and counting" : "no live source" },
    { cat: "Top scorer", tone: "blue", Icon: Stein, value: r.topScorer ?? "—", note: d.topScorerGoals != null ? `${d.topScorerGoals} goals` : "" },
    { cat: "Dark horses", tone: "blue", Icon: Pretzel, value: dh, note: "reached QF+" },
    { cat: "England exit", tone: "blue", Icon: Ball, value: r.englandExit ?? "Still in", note: r.englandExit ? "out" : "still standing" },
  ];
  return (
    <div className="vgrid">
      {cards.map((c) => (
        <div key={c.cat} className={"panel " + c.tone + " vcard"}>
          <div className="vcard__top">
            <span className="vcard__cat">{c.cat}</span>
            <c.Icon size={34} rot={-6} />
          </div>
          <div className="vcard__val">{c.value}</div>
          <div className="vcard__note">{c.note}</div>
        </div>
      ))}
    </div>
  );
}

// Full-width predictions table — everyone's raw calls, all categories.
function Wallchart({ players }: { players: Player[] }) {
  const rows: { cat: string; pick: (n: string) => string }[] = [
    ...WALL_CATS.map((c) => ({ cat: c, pick: (n: string) => PICKS[c][n] ?? "—" })),
    { cat: "Notable mad shit", pick: (n: string) => MAD_SHIT[n] ?? "—" },
  ];
  return (
    <div className="panel blue">
      <div className="chart-scroll">
        <table className="chart" style={{ "--cols": players.length + 1 } as React.CSSProperties}>
          <thead>
            <tr>
              <th className="cat"> </th>
              {players.map((p) => (
                <th key={p.name}>
                  <span className="chead">
                    <span className="av sm" style={{ background: TONE_BG[p.tone] }}>{p.init}</span>
                    {p.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.cat}>
                <td className="cat">{row.cat}</td>
                {players.map((p) => (
                  <td key={p.name}><span className="v">{row.pick(p.name)}</span></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SetupCard({ message }: { message: string }) {
  return (
    <section className="wrap" style={{ paddingTop: 28 }}>
      <div className="panel red" style={{ padding: 24 }}>
        <h2 style={{ fontFamily: "var(--anton)", textTransform: "uppercase", marginTop: 0 }}>Backend warming up</h2>
        <p style={{ fontWeight: 500 }}>Live values couldn&apos;t be loaded yet. They fill in automatically once data is ingested.</p>
        <pre style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>{message}</pre>
      </div>
    </section>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const { all } = await searchParams;
  const players = all ? ALL_PLAYERS : PEOPLE;

  let dash: Dashboard;
  try {
    dash = await getDashboard();
  } catch (e) {
    return <div className="stage"><SetupCard message={String(e)} /></div>;
  }

  return (
    <div className="stage">
      <Banner d={dash} />
      <section className="wrap">
        <SectionHead color="gold" icon={<Stein size={42} className="ic" />} title="Where Things Stand" />
        <LiveValues d={dash} />

        <SectionHead color="red" icon={<Sausage size={42} className="ic" />} title="The Predictions" />
        <Wallchart players={players} />
      </section>
    </div>
  );
}
