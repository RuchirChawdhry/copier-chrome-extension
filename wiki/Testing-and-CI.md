# Testing and CI

## Local validation

```sh
pnpm check
pnpm build
pnpm verify:build
pnpm test:e2e
```

Unit tests cover reusable core behavior; demo tests cover the sample domain. Browser tests load the extension into bundled Chromium. The build verifier checks the declared manifest, required assets, icons and production-only output.

Run `pnpm test:reload` only in a disposable generated project with the popup enabled and no existing dev server. It temporarily changes popup and worker source, checks selective and full reload, restores the files, and leaves a development build. Run `pnpm build` afterward.

At the source repository root, run `python -m unittest discover -s tests` with Copier installed and full Git history to test generation and update fixtures. The representative feature matrix is available in `tests/validate_features.mjs`.

## Shared workflows

Generated projects call centralized Node CI and Chromium release workflows. The template reuses shared Copier validation and release publishing. Its platform workflow tests Windows and Ubuntu, both clean and demonstration profiles, including actual Git hook execution and development reload. Browser validation uses bundled Chromium, not every Chromium-based browser.

See [ci-workflows](https://github.com/RuchirChawdhry/ci-workflows) for the reusable workflow implementations.

## Screenshot automation

Run `pnpm screenshots` inside a generated project to capture enabled extension pages in light and dark appearance. These are page renderings, not native browser chrome.

For the template gallery, run **Actions → Refresh screenshots → Run workflow** on main. It generates both profiles with all optional capabilities enabled, checks rendered theme values, captures the pages, and launches headed Chromium on Xvfb for native menu captures. AT-SPI verifies the expected menu entries before capture.

The gallery contains 26 images: 16 page views and 10 native context menus. The publisher verifies the complete set and dimensions, replaces root-level screenshots and commits only changes. Failed captures leave the prior gallery intact.

- [Screenshot gallery](https://github.com/RuchirChawdhry/copier-chrome-extension/tree/main/screenshots)
- [Refresh screenshots workflow](https://github.com/RuchirChawdhry/copier-chrome-extension/actions/workflows/screenshots.yml)

## Performance

Run `pnpm bench` to measure navigation-to-DOM mount and initial data readiness. Reports include first navigation, subsequent p50/p95, raw samples and environment details. Run `pnpm report:size` for file, surface and worker sizes, including per-file gzip measurements. Both reports are included with release assets.

Compare equivalent feature sets, browser versions and runners. These measurements are not physical toolbar-click latency, actual paint timing or native panel animation. No performance budgets are currently enforced.

See [Releases and Updates](Releases-and-Updates).
