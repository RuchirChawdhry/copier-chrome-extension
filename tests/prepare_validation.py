"""Temporary validation-branch helper: sync formatted generated sources."""
import json
from pathlib import Path

root = Path("../..")
template = root / "template"
for subdir in ("src", "scripts", "tests"):
    for path in Path(subdir).rglob("*"):
        if path.is_file():
            (template / path).write_bytes(path.read_bytes())
for name in ("biome.json", "tsconfig.json", "playwright.config.ts", "vitest.config.ts"):
    (template / name).write_bytes(Path(name).read_bytes())
package = Path("package.json").read_text()
for key, value in (("name", "project_slug"), ("extensionName", "project_name"), ("description", "project_description")):
    rendered = json.loads(package)[key]
    package = package.replace(json.dumps(rendered), "{{ " + value + " | tojson }}", 1)
(template / "package.json.jinja").write_text(package)
for path in Path(".").glob("*.html"):
    (template / (path.name + ".jinja")).write_text(path.read_text().replace("My Chromium Extension", "{{ project_name | e }}"))
