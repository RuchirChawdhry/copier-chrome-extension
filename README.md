# copier-chrome-extension

A Copier template for low-latency Chromium extensions using Manifest V3, TypeScript, Svelte 5, Vite, esbuild, pnpm, Vitest, Playwright, and Biome.

Generated extensions include working examples of a toolbar popup, sidebar, settings page, webpage context menu, and toolbar-icon context menu. All five can be enabled or disabled through Copier prompts. UI entry points are independently compiled; the background worker is not required for first UI render.

## Generate

Install [Copier](https://copier.readthedocs.io/) and run:

```sh
copier copy --vcs-ref=HEAD gh:RuchirChawdhry/copier-chrome-extension my-extension
cd my-extension
git init -b main
pnpm run setup
pnpm dev
```

Load the generated `dist/` folder as an unpacked extension in Chromium or Edge. See the generated README for available tests, benchmarks, and commands.

This repository's workflow template is nested under `template/` and will not run as a GitHub Action here. Generated projects include PR/manual validation using the shared Node CI workflow.

The generated project includes typed RPC, reactive validated storage, context-aware logging, automated light/dark screenshots and Playwright trace artifacts, unified setup/check commands, placeholder PNG icons (16, 32, 48, 128 px), a development-only automatic reload server, staged formatting and import organization, an AGENTS.md, and committed Copier answers for subsequent `copier update --vcs-ref=HEAD` from a clean Git checkout.

## Verification

The generated project provides `pnpm verify:build` to check Manifest V3, selected surfaces, and the existence of packaged scripts and styles. `pnpm test:e2e` exercises bundled Chromium through Playwright. `pnpm test:reload` verifies two consecutive automatic reloads in a disposable Developer Mode profile. Run `python -m unittest discover -s tests` with Copier installed and a full Git clone to verify generation and updates. Use a disposable generated project for the browser feature matrix (`node /path/to/copier-chrome-extension/tests/validate_features.mjs`) and `pnpm test:reload`; these tests temporarily edit generated project files.

Use `pnpm bench` for extension-page navigation-to-Svelte-mount measurements. For real installed Chrome and Edge builds, connect to their CDP debugging profiles with `node scripts/bench.mjs --cdp=... --extension-id=...` (details in the generated README). These are **not** physical toolbar-click benchmarks.

This source repository keeps generated CI under `template/.github/workflows`, so it has no active GitHub Actions workflows.
