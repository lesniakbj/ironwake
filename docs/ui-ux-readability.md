# UI/UX readability pass

The interface prioritizes the next decision: start a run, deploy to the next mission, fit a component, or act in combat. Shared styling lives in `dist/readability.css`; campaign, workshop, and combat layouts have their own `*-ux.css` files, loaded after the legacy styles.

- **Type and contrast:** self-hosted Inter for interface text and Barlow Semi Condensed for headings. Warm ivory text on navy surfaces, amber commands and objectives, cyan allied/ready states, and red critical states. Font licenses are bundled in `dist/fonts/`.
- **Navigation:** primary destinations stay visible on desktop. A native Menu disclosure holds controls, saved mechs, effects, and reporting, plus navigation on phones. Combat has one utility menu. Keyboard focus returns to the menu after dialogs close.
- **Campaign:** next mission and deployment lead the screen. Loadout, the full route, contracts, and the last report expand on demand. New refit choices open automatically. Disclosure state and focus survive campaign re-renders; invalid builds explain the blocked launch next to Deploy.
- **Workshop:** sockets, component choices, and inspection have distinct stages. Three standard weight classes lead frame selection; six alternate designs expand separately. Selecting an alternate keeps it visible after fitting. On phones the inspection precedes the component list.
- **Combat:** health, independent hands, dash, and special have a clear hierarchy. Duplicate schematic/status information and the solo squad panel are removed from the visual layout. Mission details expand on hover or keyboard/touch focus. Multiplayer squad status, essential objective progress, radar, and touch actions remain available.
- **Controls:** essential bindings appear first. Detailed movement, weapon, enemy, campaign, and effects explanations use native disclosures.

## Validation

Run `npm test` and `npm run build` for the existing gameplay suite and Worker dry-run build. For local Chrome UI checks, install Playwright in a development environment and run:

```sh
node scripts/check-ui-ux.mjs
```

`PLAYWRIGHT_MODULE` can point to a Playwright module URL when it is provided outside this checkout. `UI_UX_OUTPUT`, `UI_UX_PORT`, `UI_UX_BASE_URL`, and `UI_UX_BROWSER_CHANNEL` customize the local check. The script uses isolated saves and never deploys the game or submits reports. It checks four viewport sizes, including touch portrait and short landscape, writes screenshots and a layout report to ignored `.artifacts/ui-ux/`, and exercises fitting, alternate designs, campaign selection/deployment, saved builds, controls, menu keyboard behavior, and combat inputs.

Screenshots in `docs/pr-media/ui-ux/` show the implemented game. This pass does not include changes from the separate, unmerged Anchorage/field-progression integration branch.
