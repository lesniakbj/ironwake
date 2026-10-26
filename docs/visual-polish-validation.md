# Visual pass validation

**Status: draft; rendered acceptance and independent approval remain open.** Implementation commit: `9fae04af0ca16c87fd30967d5b531b055f23a9d1`. The final evidence commit adds documentation only. [Research and implementation decisions](visual-polish-research.md), [exact dependency manifest](visual-polish-manifest.json), [full test output](visual-polish-tests.txt), and [structural measurements](visual-polish-structure.json) accompany this report.

## Integration

Fresh GitHub inspection verified canonical `loganthorneloe/ironwake:main` at `dbed1091741a9ebdf911ba796e4adf7711c19f4d` and these outstanding heads:

| PR | Exact included head | Depends on |
| --- | --- | --- |
| #14 cinematics | `0efb32163ea02822c9956358772b1f977bb2d457` | current main |
| #16 Anchorage/career | `f6f26b8bff7b8064e952d3262d9fdef657e5f700` | #14 |
| #17 field progression | `41b638f3d25e7408cc44b2e7e20174b176f35308` | #16 |
| #18 UI | `a4c7f8949f05ff3341a3a2184a553982b7051b5e` | #17 |
| #19 architecture | `5492bdb286ce48b45fc6e66be3e50abc1482ccce` | #18 |

Every adjacent dependency and current main was verified with `git merge-base --is-ancestor`. The new isolated branch starts from the complete #19 stack, avoiding redundant merges. No textual merge conflicts were introduced. Semantic compatibility is guarded by the existing campaign, hub, field, cinematic, UI and architecture suites plus the new presentation-only simulation comparison. PRs #12 and #15 are already merged. The review/landing order is #14 → #16 → #17 → #18 → #19 → this pass; independent approvals are still required. The PR targets canonical main and consequently shows the stacked diff, including the module/formatting migration. Review the visual-only delta from `5492bdb` separately.

The source worktrees were inspected before work. `coop-enemy-scaling` had unrelated staged work and remains untouched. The earlier integration at `40a07bf` was read and selectively reused for arena art; it was not overwritten or merged wholesale. Work is isolated in `C:/Users/brend/Documents/Codex/2026-10-26/task/ironwake-visuals`.

## Executed checks

| Check | Result |
| --- | --- |
| Full `node --test --test-reporter=spec tests/*.test.js` after the final source changes | **456 passed, zero failed/cancelled/skipped**; 44.1 seconds locally |
| New visual regressions | 11 pass: surface alignment/edges/flight, duplicate events, no airburst/landing/edge scorch, caps, time rewind, teardown, Reduced mode, ray isolation, all nine arena rebuilds and actual simulation equivalence |
| Syntax: every authored JS/CJS/MJS plus inline HTML scripts under dist/scripts/tests/worker, excluding vendor | **266 checks, zero failures** |
| `node scripts/check-architecture.mjs` | **237 modules, 59 extracted modules**, pass |
| Repository Prettier write/check scope | Pass; final package `format:check` also passes through installed pnpm with `--config.verifyDepsBeforeRun=false` |
| `git diff --check` | Pass |
| Pinned Wrangler **4.151.1** `deploy --dry-run --outdir build` | Pass; 285 assets, worker 11.83 KiB / 4.06 KiB gzip; no deployment |
| Exact dependency ancestry | All five current PR heads and canonical main included |

The repository has no separate ESLint or TypeScript command. Existing installed dependencies were copied into this isolated checkout; no dependency manifest or lockfile changed. An initial pnpm subprocess could not find `pnpm`; the command-local option above avoids its unnecessary dependency-install subprocess. The formatter itself and later package command pass. An initial Wrangler log write outside the workspace was denied; the successful repeat sets `WRANGLER_LOG_PATH` inside `.openai/visual-pass`. No global settings or credentials changed.

The suite includes campaign result/reward/save/retry and interrupted/repeated deployment logic inherited from the stack. Those are automated/synthetic checks, not manually played wins or fresh browser interaction. Browser scripts were not launched through an alternate driver after the URL guard.

## Performance observations

`node scripts/check-visual-structure.mjs` compares the exact integrated baseline against the implemented scene without launching a browser. Across nine arenas, initial visible mesh groups fall from **36–45 to 32–37** and shadow-candidate groups fall from **25–32 to 18–20**, after sharing instance colors. This is scene structure before camera culling, not measured GPU draw calls. Static geometry rises from **3,244–5,720 to 6,508–11,056 triangles**. The art has a real geometry cost even though batching reduces groups.

The animated additions use at most two surface draws and one Points draw; static practical pools add one draw. Hub additions use three draws. These have no shadow casting, extra render targets or depth writes. Standard/compact budgets are respectively **1024²/512² shadow texels, 1.35/1.0 DPR ceilings, 96/32 motes and 24/8 scorch slots**. Reduced hides motes and renders at most four quiet marks. Contacts remain capped at 52.

A synthetic 4-pilot/48-enemy/18-explosion snapshot was sampled for 600 Node updates after warmup in each tier/motion mode. See the JSON for local medians and p95s (roughly hundredths of a millisecond). It measures CPU transform/buffer preparation only. There is **no GPU timing, FPS, browser memory-leak proof or physical-device performance claim**. The new shaders still need an actual WebGL compilation/render check.

## Browser and screenshot blocker

No fresh implemented-game screenshot or interactive validation was completed for this pass. Opening `http://127.0.0.1:4310/ironwake/` in a new supported in-app-browser tab timed out with `net::ERR_CONNECTION_TIMED_OUT`. The subsequent action `cua.getTab('1', { browser: '2' })` was **denied** because tab 1 contained the browser-generated `data:text/html;charset=utf-8,...` error document: **“Blocked browser navigation by Browser Use URL policy.”** The failed URL is the main game above. That inspection remains stopped and was not retried or bypassed through another route, browser, native UI or headless driver.

The prior denied navigation to `http://127.0.0.1:4203/tests/field-browser.html` and the separate denied `data:error` cleanup also remain stopped. This work did not retry either action. A historical desktop image from the older local integration was inspected as art reference only. It is not a before/after comparison, and no old capture is presented as evidence for this source state.

Remaining gates: fresh desktop and portrait/landscape/touch Full/Reduced rendering and occlusion checks; comparable screenshots; shader/console inspection; interactive station/deploy/cancel/retry/feedback/return replay; manually played campaign victory; independent remote-squad validation; physical mobile/low-end GPU measurements; independent review/approval. The PR stays draft. No merge, auto-merge, deployment, force-push, existing-base change, review reply or thread resolution is performed.
