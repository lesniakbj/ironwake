# Interface redesign

The interface uses distinct workspaces for starting play, planning a drop, fitting a machine, and fighting. Each workspace has its own composition and interaction model.

| Workspace | Layout and behavior |
| --- | --- |
| Command deck | Full battlefield backdrop with three foreground decisions: campaign, workshop, and squad. A saved run changes the campaign action into Continue with a smaller New run control. |
| Operations | Tactical illustration from playable mission geometry, connected nine-mission route, five working tabs, and persistent launch station. Loadout, refits, contracts, and reports have dedicated workspaces. |
| Fitting bay | Socket navigation, central 3D viewer, bounded component catalog, persistent save/test actions. Hover previews geometry; click or focus selects a candidate for comparison. Install explicitly commits it. Comparisons use actual armor, boost, payload, range, and cooldown calculations. |
| Chassis registry | Start with the fitted class and compare three platforms. Class navigation, authored silhouettes, comparable stats, and separate Fit frame / Factory loadout commands replace the initial fifteen-card wall. |
| Armory | Saved machines show chassis silhouettes, equipment, armor, mass, and boost. Load is primary; deletion requires a second click. The empty state leads to the fitting bay. |
| Combat | Hull and integrity at lower left, independent graphical weapon pods at lower center, movement and radial special at lower right. Mission objectives use a native disclosure; radar occupies the upper-right edge. Real attack and recharge state drive button feedback. |
| Handbook | Topic navigator and reading pane. Essential bindings appear as physical keycaps; all detailed weapon, enemy, movement, campaign, and effects guidance remains available. |

The desktop shell reserves an 88px navigation rail and 64px header. Phones use a 68px bottom bar. Operations and workshop own their scrolling regions; deployment and fitting actions remain available independently of long catalogs. Short landscape has explicit layouts, including coarse-pointer controls.

`dist/readability.css` owns the shell, command deck, shared controls, and handbook. `campaign-ux.css`, `workshop-ux.css`, `chassis-ux.css`, and `combat-ux.css` own their workspaces. `workshop-ux.js` separates inspection from persistence. `interface-ux.js` manages wayfinding, utility menus, handbook topics, and dialog focus. Typography is self-hosted Inter and Barlow Semi Condensed; licenses are bundled in `dist/fonts/`.

## Validation

Run `npm test` and `npm run build` for the gameplay/API suite and Worker dry-run build. The optional Chrome integration check exercises real actions with isolated local saves:

```sh
node scripts/check-ui-ux.mjs
```

Set `PLAYWRIGHT_MODULE` to a module URL when Playwright is installed outside the checkout. `UI_UX_OUTPUT`, `UI_UX_PORT`, `UI_UX_BASE_URL`, and `UI_UX_BROWSER_CHANNEL` customize the run. Screenshots and layout results go to ignored `.artifacts/redesign/` by default. Checks cover four viewport sizes, actual touch controls, campaign tabs and persistence, preview-versus-install behavior, keyboard menus, saved builds, handbook topics, combat inputs, earned refits, and squad-layout fixtures.

Screenshots and GIFs in `docs/pr-media/ui-ux/` show the implemented game. GIFs record actual component preview/installation and campaign workspace switching. Multiplayer layout uses fixtures; live peer connections are not covered by this UI check.
