# In-game reports and suggestions

Press **F8**, **Report [F8]** in the menu, or **Report / Suggest [F8]** in combat.
The game captures its rendered 3D view automatically, releases mouse capture and
opens a report. Choose Bug or Suggestion, enter a title, and answer the four
prompts with text, a voice recording, or both. Voice reports can cover the prompts
instead of typing. Recordings are optional, start only after pressing Record and
granting microphone access, stop at 60 seconds, and can be played back or removed.
Closing the dialog retains the current draft in memory until the page is closed
or reloaded. Closing stops microphone use. Drafts are not stored in browser storage.

Solo simulation pauses while the report is open. Co-op continues with neutral
input from the reporting player. The screenshot is the game canvas, without DOM
HUD overlays or the report dialog. Captures are bounded to 1600 pixels wide and
1.5 MB JPEG. Retake updates the screenshot and its context together. If graphics
capture fails, the form explains this and still accepts text/audio reports.

Reports include mission/mode/seed, game time/state, player position/health,
loadout, effects preference, viewport and browser. They exclude invite codes,
peer IDs, other players' identities, saves, arbitrary console logs and IPs.
Review the preview and context, then check the public-sharing acknowledgment.
Submission creates an issue directly in `loganthorneloe/ironwake` and returns its
link. Bug and suggestion titles/prompts distinguish the two types without relying
on pre-existing repository labels. Uploaded voice reports are linked, not transcribed.

## One-time production configuration

The game never asks players for GitHub accounts or credentials. A repository
maintainer must configure these server resources before direct submission works:

1. Create an R2 bucket: `npx wrangler r2 bucket create ironwake-feedback-media`.
2. Create a fine-grained GitHub token restricted to `loganthorneloe/ironwake`,
   with **Issues: Read and write**. Use a dedicated reporting identity if desired.
   No repository contents write permission is needed.
3. Store it only as a Worker secret:
   `npx wrangler secret put GITHUB_FEEDBACK_TOKEN`.
4. Run the existing test/build checks and deploy with `npm run deploy`.
   `wrangler.jsonc` binds R2, a SQLite Durable Object per report, and the native
   rate limiter (three submission attempts per IP per minute per Cloudflare location).
   The `1001` rate-limit namespace must remain reserved for this feature in this account.

No production resources, secrets or issues are created by tests/builds. Until
configured, the availability endpoint disables submission and explains that the
draft can still be prepared. Local full-stack development uses `npm run dev` and
an ignored `.dev.vars` file with the token; Wrangler emulates R2 and Durable Objects
locally. **Do not use a real token for UI tests**: mock GitHub or the report endpoint.
The static preview server does not run the reporting Worker.

## Storage, retries and moderation

The Worker validates same-origin submissions, payload size, title/details and media
types before calling GitHub. The target repository and attachment URL paths are
server-controlled. The token never enters client assets. Media has fixed MIME
types, `nosniff`, and a restrictive CSP. Attachments are public to anyone holding
their unguessable UUID URLs; those links appear in the public GitHub issue.
An administrator can remove media by deleting `<report-id>/screenshot.jpg` and
`<report-id>/voice.*` from R2. Keep submitted attachments for the lifetime of the
issue; do not apply an automatic expiry unless losing old issue evidence is acceptable.
Failed reports may leave orphaned uploads which can be removed manually.

A Durable Object serializes each report UUID and stores the GitHub receipt.
Client retries reuse that UUID and return the original confirmed issue. An
ambiguous upstream timeout/5xx is deliberately locked against another create;
the player is told to check the issue list. A maintainer can search the issue body
for `ironwake-report:<report-id>` to reconcile it. Explicit upstream 4xx rejection
allows the same draft to retry. Server-side credentials mean anonymous reports
appear under the configured reporting identity; rate limiting reduces spam but
does not replace repository moderation.

## Verification

`npm test` includes report validation, upload restrictions, canonical issue creation,
duplicate/concurrent submission handling, retry ambiguity, availability and media
serving checks with mocked GitHub. `node scripts/check-feedback.mjs` runs optional
Chrome/Playwright checks for F8, canvas evidence, forms, microphone lifecycle,
submission failures, suggestion success, mobile layout and solo pause. Set
`PLAYWRIGHT_MODULE` to an installed Playwright ESM entry point if needed. Browser
checks mock submission and create no repository issues.

References: [GitHub issue API](https://docs.github.com/en/rest/issues/issues#create-an-issue),
[MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder),
[Worker rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).
