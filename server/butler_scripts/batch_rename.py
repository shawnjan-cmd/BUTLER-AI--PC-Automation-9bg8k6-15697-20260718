from pathlib import Path
ROOT = Path.home() / "Desktop" / "rename_me"   # ← edit me
if not ROOT.exists():
    print(f"Create {ROOT} or change ROOT in the script."); raise SystemExit
n = 0
for f in ROOT.iterdir():
    if not f.is_file(): continue
    new = f.with_name(f.name.lower().replace(" ", "_"))
    if new != f and not new.exists():
        f.rename(new); n += 1
print(f"✓ {n} files renamed")