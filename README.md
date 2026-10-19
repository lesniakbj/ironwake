# IRONWAKE

A browser mech-combat prototype for 1–4 players. **[Play at thorneloe.ai/ironwake](https://thorneloe.ai/ironwake/).**

Build and paint a mech, fit two independently controlled weapons and a special, and fly into Cinderfall: a multi-stage planetary operation targeting about 15 minutes. A training platform and AI duel are also available.

## Play

- **WASD:** horizontal thrust. **Space:** fly upward; release to descend.
- **Left / right mouse:** use the corresponding hand. Hold to repeat fire; railguns charge automatically, fire, recover and repeat.
- **Shift:** directional damaging dash. **E:** rechargeable special.
- **M:** sound. **H:** controls. Arrow keys turn if mouse capture is unavailable.
- Mechs and random callsigns persist in browser storage. Saved mechs can be exported and imported as JSON.

Five frame components trade armor against movement speed and booster capacity. Both hand mounts accept ranged, melee or defensive equipment. Overweight mechs remain editable but cannot deploy. Damage, cooldowns, range, area effects and utility vary across weapons.

## Develop

Requires Node.js 22.13+ (24 recommended).

```sh
npm ci
npm test
npm run dev
```

Open **http://localhost:4174/ironwake/**. `dist/` contains the source ES modules and public assets; no frontend compilation is necessary. `worker/index.js` handles the subpath and serves those assets. Local browser harnesses under `tests/` are development-only and can be served with `python3 -m http.server 4175` from the project root.

```sh
npm run build  # Cloudflare dry-run bundle
npm run deploy
```

Deployments use Wrangler authentication stored outside this repository. The checked-in route targets `thorneloe.ai/ironwake*`; change the route and zone for another domain. Workers.dev and preview URLs are disabled. There are **no database bindings, API secrets or account credentials** required by the game. Never commit `.env`, `.dev.vars`, Wrangler state or database exports.

## Multiplayer

PeerJS provides public room discovery; WebRTC carries game traffic directly between browsers. The squad host runs the authoritative simulation and sends snapshots. Players join and ready up before deployment. Keep the host tab active.

Public PeerJS signaling and Google STUN require internet. There is no TURN relay, dedicated game server, host migration or mid-mission joining. Restrictive NAT/firewalls can prevent connections. Callsigns are random cosmetic identifiers, not authenticated accounts. Protocol v40 separates this release from earlier clients.

## Project layout

- `dist/core.js`, `planet-mission.js`: simulation, combat and mission progression.
- `dist/three-view.js`, scene/model/effect modules: cel-shaded Three.js rendering.
- `dist/app.js`: workshop, HUD, input and room lifecycle.
- `dist/audio.js`, `sound-design.js`: synthesized sound effects.
- `tests/`: simulation, controls, rendering fixtures and hosting checks.
- `worker/`: Cloudflare asset routing; only `dist/` is published as static files.

Cinderfall scales objectives and enemies for 1–4 pilots. Two rare siege-mech arrivals and the reactor warden have warning, descent and impact phases. The estimated mission duration comes from a deterministic pacing model, not a complete human playtest; difficulty remains a work in progress.

The old site provides a one-time browser-to-browser transfer of saved mech builds. It does not transfer old pilot tokens or database records. The receiver accepts messages only from the exact legacy origin and opening window, sanitizes builds, and retains at most 12 saves.

## Third-party code

Three.js and PeerJS are vendored under `dist/vendor/`. Their license notices are included alongside them. No private design-kit source, hosting credentials or player data is included in this repository.
