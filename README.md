# IRONWAKE

A browser mech-combat prototype for 1–4 players. **[Play at thorneloe.ai/ironwake](https://thorneloe.ai/ironwake/).**

Start a **New campaign** to open the Kepler-9 command board. Inspect colored territory cells, select a Cinderfall landing zone, choose a mech and special weapon, and deploy solo or with up to three friends. **Continue campaign** restores your front from this browser. Open **Workshop** to customize components and paint, enter the **Target range**, or start an **AI duel**.

## Campaign outline

The overworld is the main deployment hub. Green cells are allied, amber contested, red hostile, and gray uncharted. Three marked cells select different insertion positions in **Cinderfall**, the only playable battlefield. Outer territories are inspectable future fronts with no missions yet; winning does not unlock additional maps.

Choose one of 15 base chassis, a saved mech, or your current workshop build. Specials can be changed directly on the board. Equipment weight still applies, and overloaded mechs cannot deploy. Workshop **Done** returns to the campaign.

The host owns the campaign, selects the shared insertion, and launches once all pilots have marked ready. Each pilot independently selects their mech and special. Changing the insertion clears the whole squad's readiness; changing a loadout clears that pilot's readiness. Guests see the host's board without replacing their own saved solo campaign. Campaign rooms use an isolated `ironwake-chassis-v1` protocol and cannot connect to clients without the chassis catalog.

After a victory, defeat, or voluntary withdrawal, return to campaign command. Results are recorded once by the host and shared with the squad; victories secure Cinderfall's three cells. Campaign state is saved on the host's browser. Cinderfall remains replayable with a fresh cover seed after each sortie. There is no host migration or mid-sortie joining.

## Play

- **WASD:** horizontal thrust. **Space:** fly upward; release to descend.
- **Left / right mouse:** use the corresponding hand. Hold to repeat fire; railguns charge automatically, fire, recover and repeat.
- **Shift:** directional damaging dash. **E:** rechargeable special.
- **M:** sound. **H:** controls. Arrow keys turn if mouse capture is unavailable.
- **V:** switch between Full and Reduced impact effects. The same control is available in the menu and controls dialog.
- Mechs and random callsigns persist in browser storage. Saved mechs can be exported and imported as JSON.

Five frame components trade armor against movement speed and booster capacity. Both hand mounts accept ranged, melee or defensive equipment. Overweight mechs remain editable but cannot deploy. Damage, cooldowns, range, area effects and utility vary across weapons.

## Base chassis roster

The workshop and campaign offer **15 chassis in five size classes**, three per class. Open the chassis selector beside the Workshop heading. **Fit chassis** keeps your parts, paint and weapons; **Factory build** loads that platform's starting kit. Parts remain independently replaceable and painted.

| Class | Starting chassis | Heavy-rated hand mounts | Relative size |
| --- | --- | --- | --- |
| Scout | Lark (recon), Needle (sniper), Wisp (aerial) | 0 / 1 / 0 | 0.76× |
| Light | Kestrel (skirmish), Ronin (melee), Harrier (aerial) | 1 / 0 / 1 | 0.90× |
| Medium | Vanguard (assault), Longbow (sniper), Warden (support) | 1 / 2 / 1 | 1.00× |
| Heavy | Bastion (defense), Anvil (artillery), Skyguard (aerial) | 2 each | 1.23× |
| Giga | Colossus (assault), Leviathan (siege), Citadel (support) | 2 each | 1.68× |

All chassis currently have two independently controlled hand mounts and one special. A heavy-rated item occupies one of those hands and consumes one heavy allowance. Railguns, Dynamo, rocket/plasma launchers, Gatling, flamethrowers, hammers and Bulwark shields require heavy-rated mounts. Payload and mount limits are validated separately, and an invalid build remains editable but cannot deploy.

Chassis change assembled armor, ground speed, lift and effective booster capacity. Sniper and aerial variants trade those attributes against their role's factory equipment. Physical scale also changes incoming hitboxes, cover/deck clearance, shield coverage, melee reach, muzzle positions and the chase camera. Damage and special ability radii retain their existing rules. Legacy custom saves keep their original stats and size.

Each chassis has an authored structural model: Scouts include a skeletal runner and four-fan drone; Lights include a layered samurai and aircraft frame; Mediums include a knight, optical-mast sniper and rounded rescue capsule; Heavies include a bunker, furnace rig and VTOL gunship; Gigas include a reactor brawler, four-legged dreadnought and tracked fortress. Heads, hulls, limbs, stance and propulsion change with chassis identity. Replaceable part tiers still affect bulk and component paint.

Chassis data lives in `dist/chassis.js`; visual identities and icons live in `dist/chassis-art.js`, and rigid shells are built by `dist/chassis-models.js`. Equipment retains the shared articulated hand mounts. See [chassis integration notes](docs/chassis-integration.md) for the merge contract with destruction, sortie progression and equipment/special art. This branch does not merge those open PRs automatically.

Run `node scripts/preview-server.mjs 4177`, then open **http://127.0.0.1:4177/tests/chassis-preview.html** for the true-size roster gallery or **http://127.0.0.1:4177/ironwake/** for the game. The gallery includes class close-ups, front/side/rear angles, bare frames, matching paint, silhouettes, equipment tests, walking and flight. Initial chassis balance still needs full campaign playtesting.

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

Public PeerJS signaling and Google STUN require internet. There is no TURN relay, dedicated game server, host migration or mid-mission joining. Restrictive NAT/firewalls can prevent connections. Callsigns are random cosmetic identifiers, not authenticated accounts. The chassis room protocol separates this release from clients without chassis rules.

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
