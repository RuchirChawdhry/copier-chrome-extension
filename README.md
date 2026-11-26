# copier-chrome-extension

A Copier template for low-latency Chromium extensions using Manifest V3, TypeScript, Svelte 5, Vite, esbuild, pnpm, Vitest, Playwright, and Biome.

Generated extensions default to a clean starter with toolbar popup, sidebar, settings and menu scaffolding. Pass `-d include_example=true` for the saved-link demonstration. All five can be enabled or disabled through Copier prompts. UI entry points are independently compiled; the background worker is not required for first UI render.

## Generate

Install [Copier](https://copier.readthedocs.io/) and run:

```sh
copier copy gh:RuchirChawdhry/copier-chrome-extension my-extension
cd my-extension
git init -b main
pnpm run setup
pnpm dev
```

Load the generated `dist/` folder as an unpacked extension in Chromium or Edge. See the generated README for available tests, benchmarks, and commands.

Generated projects include PR/manual validation and tag-based release publishing through ci-workflows. The template itself uses a version-change release trigger and weekly dependency refresh.

The generated project includes typed RPC, reactive validated storage, context-aware logging, automated light/dark screenshots and Playwright trace artifacts, unified setup/check commands, placeholder PNG icons (16, 32, 48, 128 px), a development-only automatic reload server, staged formatting and import organization, an AGENTS.md, and committed Copier answers for subsequent `copier update` from a clean Git checkout.

## Verification

The generated project provides `pnpm verify:build` to check Manifest V3, selected surfaces, and the existence of packaged scripts and styles. `pnpm test:e2e` exercises bundled Chromium through Playwright. `pnpm test:reload` verifies two consecutive automatic reloads in a disposable Developer Mode profile. Run `python -m unittest discover -s tests` with Copier installed and a full Git clone to verify generation and updates. Use a disposable generated project for the browser feature matrix (`node /path/to/copier-chrome-extension/tests/validate_features.mjs`) and `pnpm test:reload`; these tests temporarily edit generated project files.

Use `pnpm bench` for extension-page navigation-to-Svelte-mount measurements. For real installed Chrome and Edge builds, connect to their CDP debugging profiles with `node scripts/bench.mjs --cdp=... --extension-id=...` (details in the generated README). These are **not** physical toolbar-click benchmarks.

## Versioned releases

`VERSION` is the template version, independent of generated package.json versions. A change to VERSION on main triggers a validated GitHub Release with a matching vMAJOR.MINOR.PATCH tag. Manual release workflow runs default to a dry run; explicitly choose publish only on main for a new version. Use `copier copy` / `copier update` to consume stable tags, or `--vcs-ref=HEAD` for unreleased changes. Review Copier conflicts before committing. When updating from v0.1.0, explicitly select `-d include_example=true` if you want to retain the saved-link demonstration; the new default is clean.

Every release includes a source archive, a generated starter extension ZIP, SHA256SUMS.txt and measured JSON reports. No browser-store publishing credentials are required.

## Dependency automation

The template's Jinja package manifest is not a native npm manifest. A weekly workflow renders the template, refreshes the lockfile within declared ranges, verifies the manifest is unchanged, frozen-installs, runs checks and browser tests, and proposes a lockfile-only PR. Enable the repository setting allowing GitHub Actions to create pull requests if disabled; without it a validated update branch and artifact remain available for review. Major dependency range changes remain explicit. Generated projects use weekly Dependabot npm and GitHub Actions updates.

The template runs validation on pull requests and manual requests, releases on VERSION changes, and a scheduled dependency refresh. Ordinary pushes that do not change VERSION do not start generated-project CI.

## Configuration and diagnostics

Edit `extension.config.json` to declare feature flags, manifest permission lists, commands and bundled content scripts. `pnpm run doctor` checks prerequisites; `reports/diagnostics.json` summarizes browser test results. UI-only development builds refresh affected pages and remove stale assets; worker or manifest changes reload the extension. Validation includes Windows and Linux. Both the template and generated projects enforce LF line endings through Git attributes.

## Screenshots

Browse [`screenshots/`](screenshots/) for the clean starter and saved-link demonstration, captured with all optional capabilities enabled. The capture workflow also tests rendered theme colors, shared headers and control sizing before updating the gallery. Both profiles include light and dark images of the popup, sidebar, General settings and Browser settings. Run **Actions → Refresh screenshots → Run workflow** on `main` to regenerate the gallery. The workflow replaces the entire generated screenshot directory only after both captures pass validation; it does not append dated images. The gallery includes actual rendered extension pages and native Chromium right-click menus (page, link in the demo, and pinned toolbar icon). Native menus are captured on a headed X11 desktop and verified via AT-SPI before publication. Chromium controls their appearance; extension CSS cannot style them. Permission prompts are not captured.

## UI foundation

Tailwind CSS v4, a shared semantic theme and source-owned Svelte 5 primitives provide consistent popup, sidebar and settings layouts. The styling follows shadcn-svelte conventions without introducing React or a component runtime.
