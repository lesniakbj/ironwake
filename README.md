# IRONWAKE

A browser mech-combat prototype for 1–4 players. **[Play at thorneloe.ai/ironwake](https://thorneloe.ai/ironwake/).**

Start a **New campaign** to open the Kepler-9 command board. Inspect colored territory cells, select a Cinderfall landing zone, choose a mech and special weapon, and deploy solo or with up to three friends. **Continue campaign** restores your front from this browser. Open **Workshop** to customize components and paint, enter the **Target range**, or start an **AI duel**.

## Campaign outline

The overworld is the main deployment hub. Green cells are allied, amber contested, red hostile, and gray uncharted. Three marked cells select different insertion positions in **Cinderfall**, the only playable battlefield. Outer territories are inspectable future fronts with no missions yet; winning does not unlock additional maps.

Choose a Vanguard, Kestrel, Bastion, a saved mech, or your current workshop build. Specials can be changed directly on the board. Equipment weight still applies, and overloaded mechs cannot deploy. Workshop **Done** returns to the campaign.

The host owns the campaign, selects the shared insertion, and launches once all pilots have marked ready. Each pilot independently selects their mech and special. Changing the insertion clears the whole squad's readiness; changing a loadout clears that pilot's readiness. Guests see the host's board without replacing their own saved solo campaign. Campaign rooms use an isolated `ironwake-campaign-v2` protocol so clients with the expanded part catalog cannot silently downgrade builds when joining an older host.

After a victory, defeat, or voluntary withdrawal, return to campaign command. Results are recorded once by the host and shared with the squad; victories secure Cinderfall's three cells. Campaign state is saved on the host's browser. Cinderfall remains replayable with a fresh cover seed after each sortie. There is no host migration or mid-sortie joining.

## Play

- **WASD:** horizontal thrust. **Space:** fly upward; release to descend.
- **Left / right mouse:** use the corresponding hand. Hold to repeat fire; railguns charge automatically, fire, recover and repeat.
- **Shift:** directional damaging dash. **E:** rechargeable special.
- **M:** sound. **H:** controls. Arrow keys turn if mouse capture is unavailable.
- **V:** switch between Full and Reduced impact effects. The same control is available in the menu and controls dialog.
- Mechs and random callsigns persist in browser storage. Saved mechs can be exported and imported as JSON.

Five frame components trade armor against movement speed and booster capacity. Both hand mounts accept ranged, melee or defensive equipment. Overweight mechs remain editable but cannot deploy. Damage, cooldowns, range, area effects and utility vary across weapons.

## Visible equipment and part catalog

The workshop offers **45 frame designs**: nine choices for each of the five sockets, including 30 new alternatives. Each has a distinct mesh silhouette and matching inventory icon. Raptor ribs, Spectre panels, circular Helios reactors, Ronin crests, radar dishes, hydraulic arms, skate runners, track sabatons, wing packs and induction halos can be mixed and painted independently. New designs inherit the established light, medium or heavy tier's stats and firing geometry.

All **15 hand weapons** add matching support hardware to the equipped side: shell clips, ammunition drums, missile racks, fuel tanks, capacitors, scabbards and shield generators. EMP, Aegis and Repair have different dorsal emitters and active beacons. A recovered Cinderfall cell bolts onto the lower backpack and disappears on delivery or drop; loose cells use the same armored canister design. Frame, equipment, paint and exhaust changes rebuild live models, including replicated allies.

Specials have different usage effects: EMP launches staggered electric waves and branching lightning, with electrical crowns on stunned targets; Aegis grows a patterned dome with field boundaries and incoming-hit ripples; Repair sends rising cross particles and flowing motes toward living allies in range. Rail and Dynamo charge rings, plasma/rocket discharge rings, Gatling spin arcs, flame nozzle wakes, phaser flow particles and melee sweeps reinforce weapon identity. Workshop **Test equipment** also previews the selected special.

The added usage effects use three fixed instanced pools, a bounded lightning buffer and at most four shield shells. Reduced mode decreases particles and removes their continuous spin, scans and orbiting motion. Effects consume existing simulation state. Damage, cooldowns and ability radii retain their existing rules.

Run `node scripts/preview-server.mjs` and open **http://127.0.0.1:4175/tests/item-gallery.html** for a rotating gallery of every frame, weapon and special, with Full/Reduced, cast timing and carried-cell controls. The server also serves the game at **http://127.0.0.1:4175/ironwake/**. This development gallery is excluded from deployed assets.

## Impact art pass

Combat uses ink-edged muzzle flashes and hit bursts, white-edged melee smears, sharper recoil and strike holds, stepped smoke, blast pressure arcs, and persistent rocket/rail/Dynamo trails. Nearby explosions and heavy hits add brief camera punches; dashes add peripheral speed lines and stronger afterimages. Larger damage numbers and layered armor cracks reinforce successful contact.

Full is the default unless the operating system requests reduced motion. Reduced removes the added camera shake, speed lines, afterimages and armor flashes, and tones down sparks, smoke and recoil. The choice is saved in this browser. There are no full-screen flash frames or simulation pauses. Camera effects are applied after the aiming ray is sampled and restored before the next frame, preserving the original aiming and combat rules.

Hit bursts share three instanced draw calls (28 hits maximum); explosions share five (18 bursts maximum). Trails use fixed histories and clean up when a battlefield resets. The effects consume existing replicated events and require no protocol change or remote art assets.

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

PeerJS provides public room discovery; WebRTC carries game traffic directly between browsers. The squad host runs the authoritative simulation and sends snapshots. PeerJS binary serialization chunks large level and horde messages before transmission; the JSON channel’s 16 KB limit is not suitable for these snapshots. Players join and ready up before deployment. Keep the host tab active.

Public PeerJS signaling and Google STUN require internet. There is no TURN relay, dedicated game server, host migration or mid-mission joining. Restrictive NAT/firewalls can prevent connections. Callsigns are random cosmetic identifiers, not authenticated accounts. Campaign protocol v2 separates the expanded part catalog from earlier clients.

## Project layout

- `dist/core.js`, `planet-mission.js`: simulation, combat and mission progression.
- `dist/three-view.js`, scene/model/effect modules: cel-shaded Three.js rendering.
- `dist/app.js`: workshop, HUD, input and room lifecycle.
- `dist/campaign.js`, `campaign-view.js`, `campaign.css`: campaign state, territory board, insertion choices and deployment loadouts.
- `dist/audio.js`, `sound-design.js`: synthesized sound effects.
- `tests/`: simulation, controls, rendering fixtures and hosting checks.
- `worker/`: Cloudflare asset routing; only `dist/` is published as static files.

Cinderfall follows a continuous, walled freight canyon through five stages: insertion, battery ridge, a crawler escort, the reactor, and extraction. Seeded cargo cover, raised decks, gantries, silo banks, route lights, windblown ash and industrial signage give each section a readable path. Reinforcements arrive at freight gates near the squad; distant ordinary robots recycle while elites and objectives persist. Enemy caps scale from 32 solo to 56 with four pilots, with short arrival telegraphs and roughly 5.5 seconds between reinforcement waves.

The menus and HUD share a monochrome green visual system inspired by the Even G2 display: thin outlines, subdued secondary text and brighter active states. Static scenery and ordinary robot parts use instanced rendering; a spatial collision index and analytic sight-line checks keep larger encounters practical. No new image/model downloads or remote font requests are needed.

Cinderfall scales objectives and enemies for 1–4 pilots. Two rare siege-mech arrivals and the reactor warden have warning, descent and impact phases. The deterministic pacing model estimates 13.2–14.8 minutes for 1–4 pilots. This is not a complete human playtest; difficulty remains a work in progress. `tests/planet-preview.html` walks through the route and `tests/cinder-stress.html` exercises four pilots against 56 robots.

The old site provides a one-time browser-to-browser transfer of saved mech builds. It does not transfer old pilot tokens or database records. The receiver accepts messages only from the exact legacy origin and opening window, sanitizes builds, and retains at most 12 saves.

## Third-party code

Three.js and PeerJS are vendored under `dist/vendor/`. Their license notices are included alongside them. No private design-kit source, hosting credentials or player data is included in this repository.
