# Getting started

## Prerequisites

Install Copier 9 or later, Node.js 22.12 or later, pnpm 10.0.0 (the generated packageManager pin), and Git. The generated development tools install Playwright's bundled Chromium. Linux may need additional browser libraries.

## Generate a project

```sh
copier copy gh:RuchirChawdhry/copier-chrome-extension my-extension
cd my-extension
git init -b main
pnpm run setup
pnpm dev
```

The clean profile is the default. To include the complete saved-link example, add `-d include_example=true` to the Copier command. To use the latest main branch rather than a stable tag, add `--vcs-ref=HEAD`. This is useful for the latest Tailwind design and native-menu gallery changes.

Copier prompts for the display name, npm-compatible slug, description and selected browser interfaces. See [Configuration](Configuration).

## Load the extension

1. Open `chrome://extensions` in Chromium or `edge://extensions` in Edge.
2. Enable Developer Mode.
3. Choose Load unpacked and select the generated `dist/` directory.
4. Pin the extension to the toolbar to access its popup and native action menu.

Keep the development server running while editing. A successful UI-only rebuild refreshes affected open extension pages; worker or manifest changes reload the extension.

## Daily commands

| Command | Purpose |
| --- | --- |
| `pnpm run setup` | Frozen install, Git hooks and Chromium |
| `pnpm run doctor` | Prerequisite report |
| `pnpm dev` | Development build and automatic reload |
| `pnpm check` | Type checking, lint and unit tests |
| `pnpm fix` | Format and organize imports |
| `pnpm build` | Production unpacked build |
| `pnpm test:e2e` | Browser integration tests |
| `pnpm package` | Verified ZIP archive |

Use the explicit `run` for setup and doctor: pnpm has built-in commands with those names.

Next: [Development and Diagnostics](Development-and-Diagnostics).
