from pathlib import Path
n = 0
for cfg in Path.home().rglob("pyvenv.cfg"):
    try:
        ver = next((l for l in cfg.read_text().splitlines() if l.startswith("version")), "?")
        print(f"  {cfg.parent}   [{ver}]")
        n += 1
    except Exception:
        pass
print(f"\n{n} virtualenvs found")