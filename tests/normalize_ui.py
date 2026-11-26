import sys
from pathlib import Path

clean, demo = map(Path, sys.argv[1:])
root = Path("template")
for p in (demo / "src/ui").rglob("*"):
    if not p.is_file():
        continue
    rel = p.relative_to(demo)
    dest = root / rel
    jinja = Path(str(dest) + ".jinja")
    if jinja.exists():
        jinja.write_text("{% if include_example %}{% raw %}" + p.read_text() + "{% endraw %}{% else %}{% raw %}" + (clean / rel).read_text() + "{% endraw %}{% endif %}")
    else:
        dest.write_bytes(p.read_bytes())
for name in ("scripts/build.mjs", "scripts/test-reload.mjs", "biome.json"):
    (root / name).write_bytes((demo / name).read_bytes())
