# Agent instructions

- Use pnpm and the committed lockfile. Run `pnpm install --frozen-lockfile` after cloning. Never edit the lockfile by hand.
- Keep the extension Manifest V3. Add permissions only when required; preserve the feature flags in `features.json`.
- Keep popup, sidebar and settings independently bundled. Do not block initial rendering on service-worker messaging. No unnecessary libraries or production keep-alive/polling.
- Register worker event listeners synchronously and only for enabled APIs. Use typed messages and shared storage helpers; serialize concurrent mutations.
- Prefer small, readable functions and native browser APIs. Use Svelte 5 runes; reuse existing styles and components.
- Run `pnpm fix` to format and organize imports. Do not bypass the staged Git hook or disable lint rules merely to pass.
- Before completion run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm verify:build`. Run `pnpm test:e2e` for browser-facing changes and `pnpm test:reload` for reload changes (popup enabled).
- Run `pnpm dev` for development; load `dist/` once as an unpacked extension. Use `pnpm build` for release builds (no reload client).
- Keep `.copier-answers.yml` committed; do not change its template metadata manually.
