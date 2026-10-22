# IRONWAKE project instructions

## Pull requests

- The canonical repository is `loganthorneloe/ironwake`.
- Always open pull requests against the `main` branch of `loganthorneloe/ironwake`, unless the user explicitly requests a different destination for that PR.
- `lesniakbj/ironwake` is a fork and may be the local `origin` or the source of a feature branch. Do not use it as the PR destination.
- Specify the destination explicitly: GitHub CLI `--repo loganthorneloe/ironwake --base main`, or connector `repository_full_name: "loganthorneloe/ironwake"` and `base: "main"`.
- Verify the created PR's base repository and branch before reporting completion. Do not infer its destination from `origin` or the branch the work started from.
- Include screenshots and/or animated GIFs in each PR where appropriate to showcase new or changed mechanics. Use screenshots for visual changes and GIFs for movement, animation, combat, and other behavior over time. Capture the implemented game, embed the media in the PR description with brief captions, and show the mechanic clearly; use before/after comparisons when helpful.
