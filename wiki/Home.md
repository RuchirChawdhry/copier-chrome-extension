# Chromium Extension Copier Template

Build low-latency Manifest V3 extensions with TypeScript, Svelte 5, Tailwind CSS 4, Vite and esbuild. Start with a clean product shell or explore the optional saved-link demonstration.

## Highlights

- **Clean by default**: Generate a product-ready starter without sample-specific logic or tests.
- **Independent interfaces**: Toolbar popup, sidebar and full-page settings have separate bundles.
- **Native browser integration**: Page and toolbar context menus, optional keyboard commands, badges and content scripts.
- **Consistent UI**: Shared semantic tokens, light and dark appearance, accessible Svelte controls and Tailwind utilities.
- **Fast iteration**: Selective page reload, staged formatting, typed storage and RPC, and structured browser diagnostics.
- **Repeatable delivery**: Frozen dependencies, verified extension ZIPs, performance reports and shared CI workflows.

## Quick start

Install Copier, Node.js 22.12 or later and pnpm 10. Then run:

```sh
copier copy gh:RuchirChawdhry/copier-chrome-extension my-extension
cd my-extension
git init -b main
pnpm run setup
pnpm dev
```

Load `dist/` as an unpacked extension in your browser with Developer Mode enabled. Use `--vcs-ref=HEAD` for unreleased template changes.

## Read next

- [Getting Started](Getting-Started) — generate, install and load your extension.
- [Interfaces and Menus](Interfaces-and-Menus) — popup, sidebar, settings and native context menus.
- [Configuration](Configuration) — manifest permissions, content scripts and feature switches.
- [Architecture](Architecture) — independent bundles, worker, RPC and storage.
- [Themes and Styling](Themes-and-Styling) — the shared Tailwind design system.
- [Development and Diagnostics](Development-and-Diagnostics) — reload, hooks and agent feedback.
- [Testing and CI](Testing-and-CI) — platform checks, screenshot gallery and benchmarks.
- [Releases and Updates](Releases-and-Updates) — versioning, Copier updates and package publishing.
- [Troubleshooting](Troubleshooting) — setup and browser problems.

Browse the [26-image screenshot gallery](https://github.com/RuchirChawdhry/copier-chrome-extension/tree/main/screenshots), [releases](https://github.com/RuchirChawdhry/copier-chrome-extension/releases) or [source repository](https://github.com/RuchirChawdhry/copier-chrome-extension).
