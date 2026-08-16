from pathlib import Path
PATH = Path.home() / "Desktop" / "lines.txt"   # ← edit me
seen = set(); out = []
for line in PATH.read_text(encoding="utf-8").splitlines():
    if line not in seen: seen.add(line); out.append(line)
PATH.write_text("\n".join(out)+"\n", encoding="utf-8")
print(f"✓ {len(out)} unique lines → {PATH}")