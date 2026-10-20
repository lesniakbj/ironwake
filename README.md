# IRONWAKE

A browser mech-combat prototype for 1–4 players. **[Play at thorneloe.ai/ironwake](https://thorneloe.ai/ironwake/).**

Build and paint a mech, fit two independently controlled weapons and a special, and fly into Cinderfall: a multi-stage planetary operation targeting about 15 minutes. Open **Workshop** to configure your build, enter the **Target range**, or start an **AI duel**. The home screen keeps only the operation and workshop as its main choices.

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

## Experimental destruction branch

Open `http://localhost:4174/ironwake/?lab=destruction` to opt into the destruction
console. The ordinary home screen, Cinderfall and campaign flow do not select
these levels. **Breakwater** is a standalone second operation: breach customs,
rupture three refinery pumps, collapse the command roof, then extract together.
The **Breach range** has no hostiles; the **Stress yard** adds dense cargo and
fuel arrays. The optional demolition kit fits hammer, rockets and repair.

This is authored, panel-based destruction, not arbitrary mesh cutting or voxel
terrain. Concrete, steel, glass, cargo, fuel and gold load-bearing columns have
different durability. Removed panels immediately stop blocking movement,
projectiles, sightlines, camera rays and minimaps. Elevated roof slabs have a
real underside; removing their four supports schedules a bounded collapse.
Fuel chains also damage nearby combatants. Debris and low rubble are cosmetic
and nonblocking so the fight keeps moving.

`destruction.js` owns the opt-in spatial index and authoritative HP state;
`destruction-mission.js` authors levels and directs objectives;
`destruction-scene.js` batches panels, debris and rubble;
`destruction-lab.js` owns the opt-in console and live counters. Definitions stay
in the initial mission; panel HP, revision, pending work and recent events travel
in normal host snapshots. Lab invites use an isolated PeerJS protocol prefix.
There are no physics bodies: caps are 240 animated debris instances, 160 rubble
instances, 48 recent fracture events, 128 pending jobs and 12 jobs per simulation
step. Counters show real scene draw calls and active debris, not a performance
guarantee. The HUD also exposes renderer geometry/texture counts for repeated
reset checks. Panel transforms are cached; only changed batches upload on a
damage revision, rubble rebuilds only on a fracture, and collision-cell survivors
are cached between revisions. Manual play/measurement remains necessary on
target hardware; no mobile/low-end frame-rate target is claimed yet.

## Multiplayer

PeerJS provides public room discovery; WebRTC carries game traffic directly between browsers. The squad host runs the authoritative simulation and sends snapshots. PeerJS binary serialization chunks large level and horde messages before transmission; the JSON channel’s 16 KB limit is not suitable for these snapshots. Players join and ready up before deployment. Keep the host tab active.

Public PeerJS signaling and Google STUN require internet. There is no TURN relay, dedicated game server, host migration or mid-mission joining. Restrictive NAT/firewalls can prevent connections. Callsigns are random cosmetic identifiers, not authenticated accounts. Protocol v41 separates this release from earlier clients.

## Project layout

- `dist/core.js`, `planet-mission.js`: simulation, combat and mission progression.
- `dist/three-view.js`, scene/model/effect modules: cel-shaded Three.js rendering.
- `dist/app.js`: workshop, HUD, input and room lifecycle.
- `dist/audio.js`, `sound-design.js`: synthesized sound effects.
- `tests/`: simulation, controls, rendering fixtures and hosting checks.
- `worker/`: Cloudflare asset routing; only `dist/` is published as static files.

Cinderfall follows a continuous, walled freight canyon through five stages: insertion, battery ridge, a crawler escort, the reactor, and extraction. Seeded cargo cover, raised decks, gantries, silo banks, route lights, windblown ash and industrial signage give each section a readable path. Reinforcements arrive at freight gates near the squad; distant ordinary robots recycle while elites and objectives persist. Enemy caps scale from 32 solo to 56 with four pilots, with short arrival telegraphs and roughly 5.5 seconds between reinforcement waves.

The menus and HUD share a monochrome green visual system inspired by the Even G2 display: thin outlines, subdued secondary text and brighter active states. Static scenery and ordinary robot parts use instanced rendering; a spatial collision index and analytic sight-line checks keep larger encounters practical. No new image/model downloads or remote font requests are needed.

Cinderfall scales objectives and enemies for 1–4 pilots. Two rare siege-mech arrivals and the reactor warden have warning, descent and impact phases. The deterministic pacing model estimates 13.2–14.8 minutes for 1–4 pilots. This is not a complete human playtest; difficulty remains a work in progress. `tests/planet-preview.html` walks through the route and `tests/cinder-stress.html` exercises four pilots against 56 robots.

The old site provides a one-time browser-to-browser transfer of saved mech builds. It does not transfer old pilot tokens or database records. The receiver accepts messages only from the exact legacy origin and opening window, sanitizes builds, and retains at most 12 saves.

## Third-party code

Three.js and PeerJS are vendored under `dist/vendor/`. Their license notices are included alongside them. No private design-kit source, hosting credentials or player data is included in this repository.
