// Read-only diagnostic for football-data.org.
// Answers: does your token see the World Cup, can we get goals + top scorer,
// and — the open question — are per-match yellow/red CARDS available?
//
// Get a free token: https://www.football-data.org/client/register
// Run (so output lands in this chat):
//   ! FOOTBALL_DATA_TOKEN=your_token node scripts/probe-football-data.mjs
//
// Makes ~5 GET requests; free tier allows 10/min, so it stays under the limit.

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
if (!TOKEN) {
  console.error('Set FOOTBALL_DATA_TOKEN first, e.g.\n  ! FOOTBALL_DATA_TOKEN=xxxx node scripts/probe-football-data.mjs');
  process.exit(1);
}

const BASE = 'https://api.football-data.org/v4';

async function get(path) {
  const res = await fetch(BASE + path, { headers: { 'X-Auth-Token': TOKEN } });
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON */ }
  return {
    status: res.status,
    ok: res.ok,
    remaining: res.headers.get('X-Requests-Available-Minute'),
    body,
  };
}

const log = (s) => console.log(s);

(async () => {
  log('\n=== football-data.org probe ===');

  // 1 — is the World Cup visible to this token at all?
  const comp = await get('/competitions/WC');
  log(`\n[competitions/WC] HTTP ${comp.status}  (requests left this minute: ${comp.remaining ?? '?'})`);
  if (comp.ok) {
    const s = comp.body.currentSeason || {};
    log(`  ${comp.body.name} — season ${s.startDate ?? '?'} → ${s.endDate ?? '?'}`);
  } else {
    log(`  ✗ ${comp.body?.message || 'not accessible on this plan'}`);
  }

  // 2 — matches → GOALS total
  const matches = await get('/competitions/WC/matches');
  log(`\n[competitions/WC/matches] HTTP ${matches.status}`);
  let finishedId = null;
  if (matches.ok) {
    const ms = matches.body.matches || [];
    const finished = ms.filter((m) => m.status === 'FINISHED');
    const goals = finished.reduce(
      (t, m) => t + (m.score?.fullTime?.home ?? 0) + (m.score?.fullTime?.away ?? 0), 0);
    log(`  ${ms.length} matches · ${finished.length} finished · Σ goals = ${goals}`);
    log(`  → Goals category: ${finished.length ? 'COMPUTABLE ✅' : '(no finished matches yet)'}`);
    if (finished[0]) finishedId = finished[0].id;
  } else {
    log(`  ✗ ${matches.body?.message || ''}`);
  }

  // 3 — scorers → TOP SCORER
  const scorers = await get('/competitions/WC/scorers');
  log(`\n[competitions/WC/scorers] HTTP ${scorers.status}`);
  if (scorers.ok) {
    const top = (scorers.body.scorers || [])[0];
    log(`  top scorer: ${top ? `${top.player?.name} — ${top.goals} goals` : '—'}`);
    log(`  → Top scorer category: ${top ? 'COMPUTABLE ✅' : '(none yet)'}`);
  } else {
    log(`  ✗ ${scorers.body?.message || ''}`);
  }

  // 4 — THE question: per-match bookings (cards)
  log('\n[match detail → bookings/cards]  ← the thing we need to verify');
  if (finishedId) {
    const d = await get(`/matches/${finishedId}`);
    log(`  GET /matches/${finishedId} HTTP ${d.status}`);
    if (d.ok) {
      const bookings = d.body.bookings;
      const populated = Array.isArray(bookings) && bookings.length > 0;
      log(`  bookings field present: ${bookings !== undefined}`);
      log(`  bookings populated:     ${populated ? `YES — ${bookings.length} entries` : 'NO (empty / absent)'}`);
      if (populated) {
        const norm = (c) => String(c || '').toUpperCase();
        const y = bookings.filter((b) => norm(b.card).startsWith('YELLOW')).length;
        const r = bookings.filter((b) => norm(b.card).startsWith('RED')).length;
        log(`  this match → yellow: ${y}, red: ${r}`);
        log('\n  ✅ CARDS ARE AVAILABLE — running yellow/red totals are feasible on this plan.');
      } else {
        log('\n  ❌ NO CARD DATA on this plan — Cards needs a 2nd provider or a paid tier.');
      }
    } else {
      log(`  ✗ ${d.body?.message || ''}`);
    }
  } else {
    log('  (no finished match available to sample yet)');
  }

  log('\n=== done ===\n');
})();
