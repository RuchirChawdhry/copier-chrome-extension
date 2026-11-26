# My Chromium Extension

Lightweight, responsive Chromium extension

Generated with [copier-chrome-extension](https://github.com/RuchirChawdhry/copier-chrome-extension).

## Development

Requires Node.js 22.12+ and pnpm 10. Initialize Git and install the locked dependencies with `git init -b main` (new projects only) and `pnpm install --frozen-lockfile`. The install automatically enables Lefthook in a Git checkout; use `pnpm hooks:install` if Git was initialized afterwards.

```sh
pnpm run setup     # Frozen install, Git hooks, bundled Chromium
pnpm check         # Typecheck, formatting/lint and unit tests
pnpm screenshots   # Capture light/dark screenshots of enabled surfaces
pnpm dev           # Rebuild and reload the unpacked extension on changes
pnpm build         # Build unpacked extension to dist/
pnpm typecheck     # Svelte and TypeScript validation
pnpm lint          # Biome formatting, imports and lint checks
pnpm fix           # Format, organize imports and apply safe fixes
pnpm test          # Vitest unit tests
pnpm test:e2e      # Playwright using bundled Chromium
pnpm test:reload   # Real development reload test (disposable project)
pnpm bench         # Chromium navigation-to-Svelte-mount benchmark
pnpm verify:build # Check packaged manifest, assets, and surface flags
pnpm package       # Cross-platform ZIP output
```

Visit `chrome://extensions`, enable Developer mode, then choose **Load unpacked** and select the generated `dist/` directory. For Edge use `edge://extensions`.

## Development reload and updates

Run `pnpm dev`, enable Developer mode in the browser extensions page, and load `dist/` once. Keep Developer mode enabled: recent Chromium versions can disable unpacked extensions on reload otherwise. Successful rebuilds notify the development-only service worker over a loopback WebSocket; it reloads the extension. Popups may close during reload and must be reopened. If the dev server was stopped long enough for the worker to become dormant, reload the unpacked extension once after restarting it. The automated reload test uses a disposable Chromium profile with Developer mode enabled; it does not touch your browser profile. Run it only in a disposable, freshly generated project with the sample popup enabled, and stop any existing dev server first. It temporarily edits the sample popup, restores its source, and leaves a development build in dist/. Run pnpm build afterwards if production output is needed. Failed builds do not replace the last successful output. For parallel projects, set `EXTENSION_DEV_RELOAD_PORT` to a different port and reload each unpacked extension once after changing ports. Run `pnpm build` or `pnpm package` for production output without the reload client. Do not run production and development builds concurrently.

The pre-commit hook runs lint-staged and Biome only on staged supported files; it formats and organizes imports and preserves unstaged edits. Commit `.copier-answers.yml` and `pnpm-lock.yaml`. From a clean committed Git working tree, run `copier update --vcs-ref=HEAD`, review changes/conflicts, then run `pnpm install --frozen-lockfile` (regenerate the lockfile if you changed dependencies). Projects generated before answers-file support require manual migration.

## Interfaces

The template supports a toolbar popup, persistent sidebar, full-page settings, webpage right-click actions, and toolbar-icon right-click actions. They are controlled in `features.json`. Edit flags and rebuild to change which surfaces are packaged; edit the corresponding Svelte components to build your own product.

The packaged popup, sidebar, and settings have isolated JS/CSS bundles, without additional lazy imports on their first render. The service worker is not needed to display the UI. The saved-link example lives in `src/example/`; the popup and sidebar subscribe directly to validated storage events without waking the worker.

Context menus are registered on install and the toolbar context menu remains browser-native. Opera's older sidebar API is not presumed compatible with MV3; test Opera separately before distributing.

Only the broad permissions needed by the enabled features are generated. Add host permissions or content scripts explicitly when your extension needs them. The initial sample does not inject scripts into webpages.

The PR-only GitHub Actions workflow is included in generated projects, not active in the Copier template repository. The generated CI calls the pinned reusable Node workflow from ci-workflows and validates the packaged extension in Playwright. It uploads browser diagnostics even on failure.

## Chrome and Edge compatibility benchmark

Playwright's bundled Chromium supports automatic extension loading. Recent branded Chrome and Edge builds do not accept the same extension sideload flags, so use a **separate, manually loaded browser profile** and attach to it through the Chrome DevTools Protocol.

On Windows PowerShell, for Edge (adjust the executable path if necessary):

```powershell
& "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=9222 --user-data-dir="$env:TEMP\edge-extension-bench"
```

Open `edge://extensions`, enable Developer mode, load the unpacked `dist/` directory, and copy the displayed extension ID. In another terminal:

```sh
node scripts/bench.mjs --cdp=http://127.0.0.1:9222 --extension-id=YOUR_EXTENSION_ID --output=reports/edge.json
```

Use an analogous fresh debugging profile for Chrome (`chrome://extensions`) on a **different port**, then:

```sh
node scripts/bench.mjs --cdp=http://127.0.0.1:9223 --extension-id=YOUR_CHROME_EXTENSION_ID --output=reports/chrome.json
```

To benchmark the bundled Playwright Chromium without connecting to a browser:

```sh
pnpm bench
```

The script measures first and repeat **navigation-to-Svelte-mounted UI** for popup/sidebar/settings pages, not physical toolbar-click latency or side-panel opening latency. Measurements from CDP-attached browsers are useful for comparative diagnostics, but do not replace manual checks of toolbar behavior, context menus, page transitions, and native panel rendering.

Only attach to browser instances and debugging ports you control. Close the debugging browser after the measurements.

## Reusable core and example

- `src/core/`: generic typed RPC client/router, validated storage, reactive Svelte store, serialization queue, logger and appearance preferences.
- `src/example/`: saved-link domain, RPC contract, storage schema, handlers and menu actions. Replace this folder and the sample UI behavior with your product.
- `src/background/index.ts`: synchronous worker wiring. Register your routes and menu listeners here.

RPC uses a typed contract, e.g. `await send('items.list', null)` returns saved items. Define input/output pairs, register validated routes, and pass JSON-serializable values (use `null`, not `undefined`, for an empty result). Use `route` to validate incoming requests; the client rejects error responses. No initial UI rendering depends on RPC.

Use `createStorage` with typed defaults and runtime validators. `get`, `set`, `subscribe`, and `observe` are key-specific; `observe` delivers the initial value and subsequent events without redundant reads. Invalid/missing values fall back to defaults. Subscribe via `watchStorage` for a Svelte-readable store. Use the queue for read-modify-write mutations in the worker; direct writes to independent preferences are fine. The existing `savedItems` and `appearance` storage keys are preserved.

Use `createLogger('popup')` (or another context). Debug/info output is development-only; warnings/errors remain in production. Avoid logging private data.

## Browser diagnostics

Run `pnpm screenshots` for predictable light/dark PNGs in `reports/screenshots/`. `pnpm test:e2e` captures the same screenshots, traces for persistent browser contexts in `test-results/`, and an HTML report in `playwright-report/`. View a trace with `pnpm exec playwright show-trace path/to/trace.zip`. CI uploads these files as `chromium-diagnostics` even on failed tests. Screenshots are extension-page renderings at fixed viewports, not browser chrome or native toolbar panels. Fixture data is synthetic; review traces before sharing if you add tests with real data.

Run `pnpm run setup` explicitly: `pnpm setup` is a pnpm built-in. Initialize Git before setup to install hooks automatically. On Linux, if browser libraries are missing, run `pnpm exec playwright install --with-deps chromium`.
