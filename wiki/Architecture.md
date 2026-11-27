# Architecture

## Generated project layout

```text
extension.config.json
package.json
pnpm-lock.yaml
src/
  background/
  core/
  content/
  ui/
    components/
    popup/
    sidebar/
    settings/
    styles.css
  example/              # demonstration profile only
scripts/
tests/
AGENTS.md
```

The clean profile omits the saved-link domain and its tests. Keep product-specific code separate from reusable core infrastructure.

## Build and runtime boundaries

Vite compiles each enabled Svelte page into an independent bundle. esbuild bundles the Manifest V3 worker and selected content-script entries. The production build writes `dist/` with local assets and PNG icons at 16, 32, 48 and 128 pixels. Initial UI rendering does not depend on waking the background worker.

The worker registers listeners synchronously to support MV3 suspension and restart. Keep long-running assumptions out of worker code.

## Reusable core

- Typed request/response RPC with runtime route validation; return serializable values and use null for empty responses.
- Key-specific typed storage with defaults and validators, initial reads and change subscriptions.
- Reactive Svelte storage subscriptions; serialize read-modify-write domain operations in the worker.
- Context-aware logging; debug and info are development-only. Avoid logging private data.
- Appearance preferences, optional permission helpers and toolbar badge helpers.

The sample stores links under `example.links`; the appearance preference is `ui.theme`. There is no legacy-key migration.

Treat content-script messages as untrusted inputs. Runtime payload validation is not a substitute for sender authorization. Define restrictions for privileged product routes and minimize storage exposure.

## Development boundary

Development uses a loopback WebSocket to notify the worker of changed output. The production build excludes the development reload client. The browser fixture uses disposable profiles, never the user's regular profile.

See [Development and Diagnostics](Development-and-Diagnostics) and [Configuration](Configuration).
