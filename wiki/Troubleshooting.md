# Troubleshooting

## Setup and dependencies

Use `pnpm run doctor` to identify missing prerequisites. Run `pnpm run setup`, not the pnpm built-in setup. Initialize Git first to install hooks, or use `pnpm hooks:install` after initialization.

If Linux browser libraries are missing:

```sh
pnpm exec playwright install --with-deps chromium
```

A frozen-install failure means the manifest and lockfile must be reconciled; do not manually edit lockfile entries. Run a normal pnpm install after intentional dependency changes and commit the generated lockfile.

## Extension does not reload

Keep Developer Mode enabled. If the development server was stopped and the worker became dormant, reload the extension once after restarting the server. Check the loopback port and stop other development instances if they conflict. Full worker reload can close the popup; reopen it manually.

## Browser differences

The automated browser is Playwright's bundled Chromium. Branded Chrome and Edge may reject command-line unpacked-extension loading flags. For a branded-browser benchmark, use a separate browser profile you control, manually load the extension, and attach the benchmark to its local CDP endpoint as described in the generated README. Close that debugging profile afterward. Do not assume Opera or Firefox support the same MV3 side-panel behavior.

## Missing menu or interface

Check `extension.config.json` and the generated manifest. Rebuild and reload after changing features. Menus are registered on installation; the clean profile does not include saved-link actions. Native menus are not affected by Tailwind theme changes.

## Build or test failure

Run `pnpm check` and `pnpm verify:build`. Inspect `reports/diagnostics.json`, Playwright traces and the CI logs. If formatting fails on Windows, verify LF line endings and run `pnpm fix`.

## Documentation publishing

This documentation lives in the source repository's wiki directory. Edit Markdown there rather than directly editing synchronized wiki pages. The shared wiki publisher requires an initialized GitHub Wiki and write access. The shared Starlight deployer requires Pages configured to use GitHub Actions. If publishing fails, inspect the relevant workflow logs.

See [Development and Diagnostics](Development-and-Diagnostics) or [Testing and CI](Testing-and-CI).
