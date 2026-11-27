# Configuration

## Copier questions

| Question | Default |
| --- | --- |
| `project_name` | My Chromium Extension |
| `project_slug` | Derived lowercase ASCII slug |
| `project_description` | Lightweight, responsive Chromium extension |
| `include_popup` | true |
| `include_sidebar` | true |
| `include_settings` | true |
| `include_page_context_menu` | true |
| `include_toolbar_context_menu` | true |
| `include_keyboard_shortcuts` | false |
| `include_toolbar_badge` | false |
| `include_optional_permissions` | false |
| `include_content_script` | false |
| `include_example` | false |

Names and descriptions must be single-line and within the configured length limits. Commit `.copier-answers.yml` so updates remember your choices.

## Declarative manifest

Edit `extension.config.json` in the generated project. It is the authoritative source for feature flags, permission lists, commands and content-script entries. The builder generates the standard Manifest V3 fields for enabled interfaces, storage, the background worker and icons. Add your product's permissions and host matches explicitly rather than editing generated `dist/manifest.json`.

For example, the following is a partial configuration for a site-specific content script:

```json
{
  "contentScript": true,
  "manifest": {
    "permissions": [],
    "host_permissions": [],
    "optional_permissions": [],
    "optional_host_permissions": [],
    "commands": {}
  },
  "contentScripts": [
    {
      "entry": "src/content/index.ts",
      "output": "content.js",
      "matches": ["https://example.org/*"],
      "run_at": "document_idle"
    }
  ]
}
```

Keep the other feature flags and minimum browser version in the complete file. Adjust event handlers when changing commands or enabling capabilities. The example match is not a recommendation to grant access to every site.

## Permissions

The clean profile does not require the sample's activeTab permission. The build includes storage and adds sidePanel or contextMenus as selected. Optional permissions must be declared before requesting them. Request them directly from a user gesture, and handle refusal or revocation. Content scripts receive access to their declared sites when enabled.

The verifier checks the generated manifest against the declaration, verifies packaged assets and icon dimensions, rejects remote executable assets in extension HTML and checks that the development reload client is absent. It is not a complete browser-store compliance or security validator.

See [Architecture](Architecture) and [Interfaces and Menus](Interfaces-and-Menus).
