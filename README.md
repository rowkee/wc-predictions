# Sweeper — World Cup Pool

A gaudy Oktoberfest-themed dashboard for a World Cup sweepstake pool: live standings,
a prediction wallchart, a "what changed today" feed, and a board of long-shot bets.

Imported from a Claude Design project and implemented as a static, in-browser React app
(React 18 + Babel standalone, no build step).

## Run locally

The `.jsx` files are transpiled in-browser via `<script type="text/babel">`, so they must
be served over HTTP (not opened as `file://`):

```bash
python3 -m http.server 8755
# open http://localhost:8755/index.html
```

## Files

| File | Role |
|------|------|
| `index.html` | Entry point — loads React, Babel, and the scripts below |
| `desktop.css` | Theme + responsive layout |
| `data.js` | Mock live tournament state |
| `art.jsx` | Flat SVG illustrations |
| `tweaks-panel.jsx` | Reusable tweak-control shell |
| `desktop-app.jsx` | The dashboard composition |

A floating **Tweaks** panel switches the banner pattern, toggles decorations, and expands
the pool to 7 players.
