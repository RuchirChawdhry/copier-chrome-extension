from pathlib import Path

template = Path("../../template")
for subdir in ("src", "scripts", "tests"):
    for path in Path(subdir).rglob("*"):
        if path.is_file():
            (template / path).parent.mkdir(parents=True, exist_ok=True)
            (template / path).write_bytes(path.read_bytes())
