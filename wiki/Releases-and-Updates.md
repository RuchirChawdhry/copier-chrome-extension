# Releases and updates

## Template versions

The source repository's VERSION controls the template release, separately from generated extension package versions. A change to VERSION on main invokes the shared validated release pipeline. Manual workflow runs default to a dry run; publishing is explicitly selected for a new version.

Stable Copier generation uses release tags. Use `--vcs-ref=HEAD` to opt into unreleased changes.

## Update a generated project

Commit your work and Copier answers before updating:

```sh
copier update
pnpm install --frozen-lockfile
pnpm check
```

Review conflicts, including custom configuration and product code, before committing. When updating from v0.1.0, explicitly pass `-d include_example=true` to preserve the demonstration. The new default is clean. The transition to declarative configuration does not provide a legacy runtime compatibility layer.

## Package an extension

```sh
pnpm package
```

The script verifies the production build and creates a ZIP and SHA-256 checksum in `release/`. The manifest version must match package.json and use a valid stable numeric version.

To publish a GitHub Release, commit the version and push its matching tag:

```sh
git tag v0.2.0
git push origin v0.2.0
```

This example assumes package.json already contains 0.2.0. Shared CI builds and tests the tagged revision, verifies the package and publishes ZIP, checksums and JSON performance reports. Template releases also include the source archive. Publishing does not submit to Chrome Web Store or Edge Add-ons.

## Dependency maintenance

Generated repositories use weekly Dependabot updates for npm/pnpm and Actions. The template renders its Jinja manifest, refreshes the lockfile within existing ranges, frozen-installs, checks and browser-tests, then proposes a lockfile-only PR when needed. Automatic PR creation requires the repository's corresponding Actions permission. Updates are not automatically merged.

Browse [published releases](https://github.com/RuchirChawdhry/copier-chrome-extension/releases).
