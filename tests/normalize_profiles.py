import sys
from pathlib import Path
clean, example = map(Path, sys.argv[1:])
template = Path("template")
for p in (example / "src").rglob("*"):
    if not p.is_file(): continue
    rel = p.relative_to(example)
    dest = template / rel
    if (template / (str(rel) + ".jinja")).exists():
        jinja = template / (str(rel) + ".jinja")
        jinja.write_text("{% if include_example %}{% raw %}\n" + p.read_text().rstrip() + "\n{% endraw %}{% else %}{% raw %}\n" + (clean / rel).read_text().rstrip() + "\n{% endraw %}{% endif %}\n")
    elif dest.exists(): dest.write_bytes(p.read_bytes())
for p in (example / "scripts").glob("*.mjs"):
    (template / "scripts" / p.name).write_bytes(p.read_bytes())
for p in (example / "tests").rglob("*.ts"):
    dest = template / p.relative_to(example)
    if dest.exists(): dest.write_bytes(p.read_bytes())
    elif p.name == "screenshots.spec.ts":
        dest = template / (str(p.relative_to(example)) + ".jinja")
        dest.write_text("{% if include_example %}{% raw %}\n" + p.read_text().rstrip() + "\n{% endraw %}{% else %}{% raw %}\n" + (clean / p.relative_to(example)).read_text().rstrip() + "\n{% endraw %}{% endif %}\n")
for name in ("playwright.config.ts", "biome.json"):
    (template / name).write_bytes((example / name).read_bytes())
