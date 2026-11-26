# Agent instructions

- Use pnpm and the committed lockfile. Run `pnpm run setup` after cloning (or `pnpm install --frozen-lockfile` if Chromium is already installed). Never edit the lockfile by hand.
- Keep the extension Manifest V3. Add permissions only when required; preserve the feature flags in `features.json`.
- Keep popup, sidebar and settings independently bundled. Do not block initial rendering on service-worker messaging. No unnecessary libraries or production keep-alive/polling.
- Register worker event listeners synchronously and only for enabled APIs. Define typed RPC contracts and validated routes; use typed storage and serialize concurrent mutations. Keep product-specific code outside `src/core/`; replace `src/example/` when building your product.
- Prefer small, readable functions and native browser APIs. Use Svelte 5 runes; reuse existing styles and components.
- Run `pnpm fix` to format and organize imports. Do not bypass the staged Git hook or disable lint rules merely to pass.
- Before completion run `pnpm check`, `pnpm build`, and `pnpm verify:build`. Run `pnpm test:e2e` for browser-facing changes; inspect `reports/screenshots/` and Playwright traces in `test-results/` ; run `pnpm test:reload` for reload changes in a disposable generated project (sample popup enabled).
- Run `pnpm dev` for development; load `dist/` once as an unpacked extension. Use `pnpm build` for release builds (no reload client).
- Keep `.copier-answers.yml` committed; do not change its template metadata manually.

- Use `createLogger(context)`; do not log private URLs, message payloads or stored user data.
