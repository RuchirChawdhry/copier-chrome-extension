# Development and diagnostics

## Development reload

Run `pnpm dev` and load the unpacked `dist/` directory once. The development server stages each successful build, compares file hashes, copies the output and removes obsolete hashed assets.

| Change | Result |
| --- | --- |
| UI-only output | Refresh affected open extension pages |
| Worker or manifest output | Full extension reload |
| Identical output | No reload |
| Compilation failure | Keep previous successful build |

This is selective reload, not incremental compilation: all enabled bundles are still built before output comparison. Full extension reloads can close the popup. Set `EXTENSION_DEV_RELOAD_PORT` to a distinct port for concurrent projects; reload the unpacked extension after changing ports. Do not run production and development builds concurrently.

## Code quality

Run `pnpm check` for Svelte/TypeScript checking, Biome and Vitest. Run `pnpm fix` to apply safe fixes, formatting and import organization. Lefthook and lint-staged process staged files before commits. Git attributes enforce LF on Windows and Linux. Initialize Git before setup, or run `pnpm hooks:install` afterward.

## Doctor and diagnostics

```sh
pnpm run doctor
pnpm test:e2e
```

Doctor writes `reports/doctor.json` and exits nonzero for missing required prerequisites. Missing Git hooks or build output are warnings. The browser tests write `reports/diagnostics.json` with test statuses, assertion errors, captured browser events and artifact paths. Inspect this before opening traces.

- `reports/screenshots/`: fixed-viewport page captures.
- `test-results/`: Playwright traces and browser event files.
- `playwright-report/`: interactive HTML report.

Open a trace with:

```sh
pnpm exec playwright show-trace path/to/trace.zip
```

Review logs, traces and screenshots before sharing them if your product uses real data. The supplied tests use synthetic fixtures. Follow the generated AGENTS.md.

Next: [Testing and CI](Testing-and-CI).
