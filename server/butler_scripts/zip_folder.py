import shutil, time
from pathlib import Path
SRC = Path.home() / "Documents"           # ← edit me
DST = Path.home() / "Desktop" / f"backup_{time.strftime('%Y%m%d_%H%M%S')}"
print(f"Zipping {SRC} → {DST}.zip …")
shutil.make_archive(str(DST), "zip", str(SRC))
print(f"✓ {DST}.zip")