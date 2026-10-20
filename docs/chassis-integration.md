# Chassis roster and integration contract

This branch starts at `loganthorneloe/ironwake:main` (`1b68a07`). PRs #3 (destruction), #4 (sortie progression) and #5 (equipment art) remain independent. Merge them into this branch when integration is requested, then target the canonical repository's **main** branch with the resulting PR.

## Chassis and equipment are separate

`dist/chassis.js` is the content registry and the shared simulation/rendering contract. It imports neither the simulation nor Three.js. A saved build identifies its platform with `build.chassis`; `build.parts`, `equipment`, `partColors` and `trailColor` remain separate. Add another platform through the registry; the workshop and campaign derive their rosters from it.

Each platform declares its size class, physical scale, armor/speed/lift/output factors, payload limit, hardpoint allowance, role, specialty and factory kit. Factory stats are examples, not fixed final stats: changing parts still changes performance. **Fit chassis** preserves the current kit; **Factory build** explicitly loads a fresh starting kit.

The initial combat contract retains two independently controlled hands and one special. `hardpoints.heavy` is the number of those hand mounts permitted to carry heavy equipment, not a count of additional guns. Do not show extra shoulder guns until an auxiliary mount schema, simulation, input controls and network replication actually support them. Extending that contract should use new mount IDs rather than changing the meaning of the existing three equipment slots.

Legacy saves without a chassis retain their original stats, physical scale and unrestricted two-hand fitting. New chassis IDs and all part/weapon IDs are validated against static registries. Runtime stat overrides are never loaded from saved builds.

## PR #5: equipment and special-weapon art

- Preserve both part-design installation and `chassis` sanitization when resolving `core.js`. The build key must contain chassis identity, parts, equipment, paint and exhaust color.
- In `makeMech`, run `buildChassisModel` first, then `addItemDetails`, before rigid-part batching. Chassis geometry owns the silhouette; item geometry owns selected equipment and carried pickups. Preserve the art pass's animated beacon/cargo exclusions.
- Apply chassis scale once to the mech root. Arm/weapon transforms, muzzle flashes and articulated accessories inherit it. Do not independently scale weapons a second time.
- Combine `partChassis` from the art pass with the chassis-default part tiers in `weapon-origin.js`; authoritative muzzle transforms must match the rendered root scale and selected arm/torso geometry.
- Retain `buildKey` as the live-model signature. Rebuild on chassis/part/paint changes as well as equipment changes.
- Ability fields retain the actual simulation radius. Weapon effects should sample world-space muzzle transforms, as the art pass already does. Preserve both the scaled workshop camera and special-preview update helper.
- A carried cell attaches to the existing body mount and inherits chassis scale. Keep the dropped canister and mounted cell mutually exclusive.

## PR #4: sortie progression

- Apply chassis factors to assembled part stats, then apply sortie upgrade modifiers. Keep chassis identity and factory loadouts separate from earned module IDs; choosing a platform must not silently install or discard a sortie upgrade.
- Preserve the generated 15-platform campaign roster when resolving campaign UI changes. Contract selection remains host-owned and personal chassis changes invalidate only that pilot's ready state.
- Use the existing validated armor/payload/heavy-slot result when accepting loadouts or deploying. Keep explicit rejection of invalid drafts on the host.
- Keep passive-module hardware separate from chassis silhouettes and hand weapons when extending the art layer.

## PR #3: destruction and Breakwater

- Use `chassisBounds(build)` for pilot radius, body height, clearance and aiming height in movement, cover clipping, swept projectile checks and destructible-structure collision queries. Do not restore the old fixed `21`-radius/`62`-height assumptions.
- Preserve the scale-aware authoritative barrel transform and third-person pivot/distance when integrating analytic sight-line and camera-obstruction changes.
- Keep cosmetic rubble nonblocking; larger chassis must still collide with intact panels and deck undersides. Size is not permission to ignore structures.

## Network and regression checks

This branch uses `ironwake-chassis-v1-` room IDs so older clients cannot normalize named chassis into legacy frames. After combining PRs, select one new normal-play protocol prefix that requires all integrated features. Keep the destruction lab's separate protocol as well. Do not accidentally select whichever string wins a merge conflict.

Run all tests after each integration. Check every factory kit; smallest/largest mixed squads; saved/JSON/snapshot round trips; invalid heavy mounts with otherwise legal weight; body-sized cover and shield coverage; both muzzle origins at several headings and elevations; all elevated objectives; and Full/Reduced special effects on Scout and Giga roots. Verify shared ranks, contracts and fracture state in actual multiplayer after integration. The current automated coverage does not replace those future multi-feature multiplayer checks.

The gallery at `tests/chassis-preview.html` uses the live model factory and a shared camera distance to show relative sizes. `tests/chassis.test.js` covers roster validity, migrations, mount rules, movement, scale/weapon agreement, hitboxes, shields, cameras and Giga clearance. Initial armor and movement tuning still needs full campaign playtesting.

## Authored chassis shells

`dist/chassis-art.js` defines fifteen visual identities and workshop silhouettes. `dist/chassis-models.js` replaces the generic rigid shells on named platforms while retaining arm, elbow, weapon and live nozzle groups. Chassis shells must be built before item or module hardware is attached: the replacement removes direct structural meshes. Head and stance offsets are visual; authoritative hand transforms remain unchanged. Selected part tiers change shell bulk and paint is applied by component. Legacy custom frames and enemies retain the original models.

Citadel uses a stationary track undercarriage, including when airborne, and suppresses walking bob. Leviathan uses four splayed supports in two articulated pairs. Other chassis have individual ground stride factors. All retain the existing simulation locomotion, including boost and flight; these models add no auxiliary guns or new chassis abilities. Shared shell geometries and rigid batching follow the existing renderer ownership rules.
