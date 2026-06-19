/* Sweeper — gaudy desktop dashboard. Reads window.WC; composes art.jsx. */
const { Stein, Pretzel, Sausage, Ball, Garland } = window;

const TONE_BG = { red: '#f6c9c5', blue: '#cfe0f4', green: '#cfe8d4', gold: '#ffe6b0' };
const SCORED = window.WC.grid.filter((g) => g.type !== 'display');
const MAD = window.WC.grid.find((g) => g.type === 'display');
const ptsOf = (table, n) => { const r = table.find((x) => x.name === n); return r ? r.pts : 0; };
const find = (n) => window.WC.people.concat(window.WC.extra).find((p) => p.name === n) || {};

function Avatar({ name, size }) {
  const p = find(name);
  return <span className={'av' + (size ? ' ' + size : '')} style={{ background: TONE_BG[p.tone] || '#eee' }}>{p.init || name.slice(0, 2).toUpperCase()}</span>;
}
function Move({ n }) {
  const d = n > 0 ? 'up' : n < 0 ? 'down' : 'flat';
  return <span className={'move ' + d}>{n > 0 ? '▲' : n < 0 ? '▼' : '–'}{n !== 0 ? Math.abs(n) : ''}</span>;
}
function abbr(s) {
  const m = { 'Last 16': 'L16', 'Winners': 'WIN', 'Quarters': 'QF', 'Semi': 'SF', 'Final': 'F', 'Oyarzabal': 'Oyar.', 'Norway/Japan': 'NOR/JP' };
  return m[s] || (s.length > 7 ? s.slice(0, 6) + '…' : s);
}

// ── banner ──────────────────────────────────────────────────
function Banner({ pattern, garland }) {
  const L = window.WC.live;
  return (
    <header className="banner">
      <div className={'banner__loz ' + pattern}>
        <div className="banner__inner">
          <div className="banner__mark">
            <Ball size={64} color="#fff" />
            <div>
              <div className="banner__word">Sweeper</div>
              <div className="banner__tag">World Cup Sweepstake · 2026</div>
            </div>
          </div>
          <div className="banner__live">
            <div className="k">Live</div>
            <div className="v">{L.stage}</div>
            <div className="t">{L.day} · {L.time}</div>
          </div>
        </div>
      </div>
      {garland && <Garland />}
    </header>
  );
}

// ── standings ───────────────────────────────────────────────
function Standings({ table }) {
  const [p1, p2, p3] = table;
  const order = [{ ...p2, slot: 'second', tag: '2nd' }, { ...p1, slot: 'first', tag: 'Champion' }, { ...p3, slot: 'third', tag: '3rd' }];
  const max = Math.max(...table.map((r) => r.pts));
  return (
    <section className="wrap">
      <div className="shead gold">
        <Pretzel size={42} className="ic" />
        <h2>The Table</h2>
        <span className="rule" />
      </div>

      <div className="podium">
        {order.map((r) => (
          <div key={r.name} className={'panel ' + (r.slot === 'first' ? 'gold' : r.slot === 'second' ? 'blue' : 'green')}>
            <div className={'pcard ' + r.slot}>
              <div className="ribbon">{r.tag}</div>
              {r.slot === 'first' && <div style={{ position: 'absolute', top: -2, right: 8 }}><Stein size={46} rot={6} /></div>}
              <div className="av lg" style={{ margin: '8px auto', background: TONE_BG[find(r.name).tone] }}>{find(r.name).init}</div>
              <div className="nm">{r.name}</div>
              <div className="pts">{r.pts}<small>POINTS</small></div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginTop: 26 }}>
        <div className="lb">
          {table.map((r, i) => (
            <div key={r.name} className={'lbrow' + (r.name === 'Rick' ? ' me' : '')}>
              <span className="rk">{i + 1}</span>
              <Avatar name={r.name} size="sm" />
              <span className="nm">{r.name}{r.name === 'Rick' && <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}> · you</span>}</span>
              <span className="bar" style={{ width: 120 * (r.pts / max), background: ['var(--red)', 'var(--blue)', 'var(--green)', 'var(--gold)'][i % 4] }} />
              <Move n={r.move} />
              <span className="pts">{r.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── wallchart ───────────────────────────────────────────────
function Wallchart({ people, table }) {
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
          <tr><th className="cat"> </th>{people.map((p) => <th key={p.name}>{p.init}</th>)}</tr>
        </thead>
        <tbody>
          {SCORED.map((g) => (
            <tr key={g.cat}>
              <td className="cat">{g.cat}</td>
              {people.map((p) => {
                const pk = g.picks[p.name];
                return (
                  <td key={p.name} className={pk.s}>
                    <span className="cell"><i className={'pip ' + pk.s} /><span className="v">{g.type === 'closest' ? pk.v : abbr(pk.v)}</span></span>
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="total">
            <td className="cat">Points</td>
            {people.map((p) => <td key={p.name} className="pt">{ptsOf(table, p.name)}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── feed ────────────────────────────────────────────────────
function Feed() {
  const items = [
    { tag: 'Goal',       tone: 'blue',  time: '20:38', text: 'Spain 2 – 1 France · 71′' },
    { tag: 'Goals',      tone: 'gold',  time: '20:38', text: '198 — Rick still the closest (+10)' },
    { tag: 'Top scorer', tone: 'red',   time: '19:55', text: 'Mbappé nets again — Angus, Hugo & Rick alive' },
    { tag: 'Dark horse', tone: 'green', time: '18:10', text: 'Japan out in the QF — Tony & Rick +10' },
    { tag: 'England',    tone: 'ink',   time: 'Yesterday', text: 'Through to the semi-finals' },
    { tag: 'Cards',      tone: 'gold',  time: 'Yesterday', text: '322 — Tim’s 368 leads, Angus 2nd' },
  ];
  return (
    <div className="panel red feed">
      {items.map((f, i) => (
        <div key={i} className="fitem">
          <span className={'tag ' + f.tone}>{f.tag}</span>
          <div className="fbody"><div className="ftx">{f.text}</div><div className="ftime">{f.time}</div></div>
        </div>
      ))}
    </div>
  );
}

// ── mad board ───────────────────────────────────────────────
function MadBoard() {
  return (
    <div className="panel gold mad">
      {window.WC.people.map((p) => (
        <div key={p.name} className="mitem">
          <div className="who"><Avatar name={p.name} size="sm" /><b>{p.name}</b></div>
          <div className="q">“{MAD.picks[p.name].v}”</div>
        </div>
      ))}
    </div>
  );
}

// ── footer ──────────────────────────────────────────────────
function Footer({ pattern }) {
  return (
    <footer className={'foot ' + pattern}>
      <div className="foot__row">
        <Stein size={56} rot={-8} /><Sausage size={56} /><Stein size={56} rot={8} />
      </div>
      <div className="prost">Prost!</div>
      <div className="sub">See you at full time — settle the mad shit in person.</div>
    </footer>
  );
}

// ── app ─────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "banner": "Blue lozenge",
  "garland": true,
  "scatter": true,
  "morePlayers": false
}/*EDITMODE-END*/;

const PAT = { 'Blue lozenge': 'lozenge', 'Gold stripes': 'stripes', 'Red gingham': 'gingham' };

function App() {
  const { useTweaks, TweaksPanel, TweakSection, TweakSelect, TweakToggle } = window;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const pat = PAT[t.banner] || 'lozenge';
  const people = t.morePlayers ? window.WC.people.concat(window.WC.extra) : window.WC.people;
  const table = t.morePlayers ? window.WC.table7 : window.WC.table;

  return (
    <div className="stage">
      <Banner pattern={pat} garland={t.garland} />
      <Standings table={table} />

      <section className="wrap" style={{ position: 'relative' }}>
        {t.scatter && <Sausage size={88} className="scatter" style={{ right: -18, top: 18, transform: 'rotate(20deg)' }} />}
        <div className="shead red">
          <Sausage size={42} className="ic" />
          <h2>The Wallchart</h2>
          <span className="rule" />
        </div>
        <div className="cols">
          <Wallchart people={people} table={table} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <div className="shead blue" style={{ marginTop: 0 }}>
                <Stein size={40} className="ic" />
                <h2 style={{ fontSize: 30 }}>Today</h2>
                <span className="rule" />
              </div>
              <Feed />
            </div>
            <div>
              <div className="shead green" style={{ marginTop: 0 }}>
                <Pretzel size={40} className="ic" />
                <h2 style={{ fontSize: 26 }}>Mad Shit</h2>
                <span className="rule" />
              </div>
              <MadBoard />
            </div>
          </div>
        </div>
      </section>

      <Footer pattern={pat} />

      <TweaksPanel>
        <TweakSection label="Festival" />
        <TweakSelect label="Banner pattern" value={t.banner} options={Object.keys(PAT)} onChange={(v) => setTweak('banner', v)} />
        <TweakToggle label="Food garland" value={t.garland} onChange={(v) => setTweak('garland', v)} />
        <TweakToggle label="Scatter snacks" value={t.scatter} onChange={(v) => setTweak('scatter', v)} />
        <TweakSection label="Pool" />
        <TweakToggle label="Add 2 more players" value={t.morePlayers} onChange={(v) => setTweak('morePlayers', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
