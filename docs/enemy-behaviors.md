# Enemy behavior and animation pass

The host owns decisions, aim, attack phases, hit checks, repair and shell impacts. Guests animate the resulting state. This pass introduces four specialist robots, expands the original three, and gives siege frames a contextual move set. It applies to campaign rounds, classic Cinderfall and the older station encounters. Training targets and the duel rival retain their own controllers.

## Research translated into implementation

- Nicolas Kraj, [Keys to Combat Design: Anatomy of an Attack](https://gdkeys.com/keys-to-combat-design-1-anatomy-of-an-attack/): separate preparation, execution and recovery; make preparation poses visually distinct and communicate the attack's direction. Here each move has authored timing, pose keys, warning geometry and a stationary recovery opening. Attack selection changes by role, range and sequence, while each move's timing stays consistent.
- Jerry Zhang, [Anatomy of an Enemy Attack in Dark Souls 3](https://www.iamjerryzhang.com/2022/07/03/anatomy-of-an-enemy-attack-in-dark-souls-3/): opening silhouettes and attack signals support the player's response, while end poses and return phases establish opportunities. Here preparation eases into a held pose, execution releases quickly, and recovery overshoots before settling. Stun visibly breaks that sequence. Prediction is sampled at commitment, never continuously corrected during the warning.
- Sumeet Jakatdar, [From Behavior to Animation: A Reactive AI Architecture for Networked First-Person Shooter Games](https://www.gameaipro.com/GameAIPro3/GameAIPro3_Chapter10_A_Reactive_AI_Architecture_for_Networked_First-Person_Shooter_Games.pdf), Game AI Pro 3: separate authoritative behavior decisions from presentation and share the state needed to choose animation. Here the renderer consumes the host's phase, elapsed time, committed aim and role. Perception history and per-attack hit sets stay on the host.

These references guide the design; IRONWAKE's timing and damage values are authored for this game's movement speeds. They are starting points for human playtesting, not a claim of equivalent combat quality.

## Roster and counterplay

| Enemy | Movement and decisions | Attack and visible tell | Counter |
| --- | --- | --- | --- |
| Hunter | Approaches on an offset flank; separates from packmates | Low crouch into a short pounce; close bite has a separate lean | Sidestep the committed direction, attack its landing |
| Wisp | Airborne orbit; withdraws when pressed | Banked anticipation into three spaced shots along a fixed direction | Rush or change direction after commitment |
| Scarab | Holds a firing band and repositions around cover | Alternates braced three-shot fan and five-shot horizontal sweep | Read the fan boundaries, flank during recovery |
| Rammer (new) | Closes to a charge band; uses stomp at close range | Plow lowers before a straight charge and long skid; stomp crouches deeper | Leave the lane; fly above the stomp |
| Needle (new) | Seeks a distant firing band; backs away when visible and pressured | Tall optical silhouette, long sightline, recoil and reload; close defensive fan | Break sightlines or rush the reload |
| Bellows (new) | Slow artillery platform; retreats when exposed | Twin tubes elevate; fixed ground circles precede delayed shells; close fan | Leave the circle, fly, or interrupt before shell release |
| Mender (new) | Follows damaged robots and orbits at support range | Opens four repair petals and a green tether; otherwise fires a burst | Interrupt or prioritize the support unit |
| Siege frame / Warden | Controls middle range | Wide fan, three-shell barrage, close stomp; more barrage choices below half hull | Bait the stomp, leave marked circles, use recovery openings |

Rammer, Needle, Bellows and Mender have separate structural models, rather than recolored versions of existing bodies. Existing Hunter/Wisp/Scarab models retain their silhouettes and gain role-specific gait and attack poses.

## Combat contract

- Every action progresses through `windup`, `active`, `recovery`, then `idle`. Ordinary windups range from 0.4 to 1.15 seconds; siege preparation reaches 1.2 seconds. Nothing damages during preparation. Melee checks only during active time, once per pilot per move, with facing, altitude, range and sightline checks.
- Attacks commit aim and target at preparation start. Prediction is modest, clamped, and based on prior observed positions. Losing a target does not turn a charge or redirect a volley. Living-target selection has distance hysteresis.
- At most two enemies commit to attacking one pilot at once, or three in a four-pilot room. Others continue maneuvering. Repair does not consume an offensive slot. Recovery releases slots but cannot be canceled into another move. These limits bound active action pressure, not the total number of bullets already in flight.
- Ground movement preserves cargo clearance around raised decks, uses the existing waypoint/collision system and subdivides charge motion. Flyers retain altitude-aware movement. Separation operates only during locomotion, so it cannot displace a planted warning or shove an attack sideways.
- EMP, lance, hammer, rail and other existing stagger sources cancel the whole action immediately, including unfinished bursts and repair. A canceled action cannot resume. Launched bullets and artillery shells remain dangerous after interruption or death of their owner.
- Artillery uses a bounded pool of 32 pending shells. It targets the floor/deck at commitment, with a visible flight countdown. Impacts check proximity, vertical distance and blast sightlines; they damage pilots, never allied robots or mission objectives. Redeploy clears pending shells. Flight more than 75 world units above the impact plane avoids them.
- A Mender repairs one other living ordinary robot by up to 32 hull after its cast, within 340 units and clear sight. It never heals itself, revives, overheals, or repairs objectives/elites. It has a five-second heal cooldown and remains destructible throughout its cast. Petals and tether disclose the target.
- Existing incoming-hit recovery, shielding, damage scaling, objective progression and combatant caps still apply. No invulnerability is added to enemies.

## Encounter integration

Ashgate teaches the original three roles. Glasswater introduces Rammers; Relay Nine introduces Needles. Iron Orchard introduces Menders; Gale Foundry introduces Bellows artillery. Later mixes combine these roles, with support in escort rounds and a broader roster in the final act. Cinderfall adds specialists progressively after the initial beachhead. Siege-leader identity, landing and mission-critical persistence remain intact.

The room prefix is `ironwake-enemy-behaviors-v1-`; both endpoints need this version because warnings and shells are gameplay-relevant replicated state. Workshop builds and campaign-save formats do not change.

## Presentation and authoring

- `dist/enemy-behaviors.js`: role stats, move timing, action selection, host controller and artillery.
- `dist/enemy-motion.js`: preparation, release, overshoot and settle poses; stable per-instance gait variation.
- `dist/robot-models.js`: structural silhouettes and articulated animation using shared instanced meshes.
- `dist/enemy-cues.js`: lane, range, repair, recovery and impact warnings. Buffers are bounded per visible combatant/shell and disposed on cleanup. Essential cues use steady opacity/progress, without warning strobes.
- `dist/core.js`: existing collision, damage and spawning integration. Host perception and hit sets are omitted from snapshots.

Reduced effects reduce hover/rotor/tail cosmetics while preserving all timing and essential pose/cue information. Hit recoil adds to the authored pose instead of replacing it. No downloaded image or model assets are needed.

Run `node scripts/preview-server.mjs 4181`, then open [Enemy laboratory](http://127.0.0.1:4181/tests/enemy-lab.html). Inspect each action, pause a pose, toggle Reduced effects, fight one archetype or use the mixed squad mode. Live controls: WASD, Space to fly, Shift to dash, E for EMP, F to fire both hands. The laboratory renders transported snapshots to exercise guest presentation. It is development-only and excluded from published assets.

## Validation and remaining playtesting

`node --test tests/*.test.js` covers the existing game plus real action cycles, commitment/dodging, burst cadence, attack limits, interruption, repair exclusions, artillery damage/cover/flight, finite model transforms and cues, progressive roster introduction and deterministic 56-enemy/four-pilot simulation. Station coverage checks 50 generated seeds across every sector. The Cloudflare dry-run validates the worker and static asset bundle.

Human solo and squad playtests should tune artillery density in the final act, support priority and how clearly each pose reads through scenery. Automated simulation and browser inspection cannot establish full-run encounter balance or multiplayer feel over real network latency.
