import os, tempfile, shutil
from pathlib import Path

target = Path(tempfile.gettempdir())
removed = freed = 0
for item in target.iterdir():
    try:
        if item.is_file() or item.is_symlink():
            sz = item.stat().st_size
            item.unlink(missing_ok=True)
            removed += 1; freed += sz
        elif item.is_dir():
            sz = sum(f.stat().st_size for f in item.rglob("*") if f.is_file())
            shutil.rmtree(item, ignore_errors=True)
            removed += 1; freed += sz
    except PermissionError:
        pass
    except Exception as e:
        print(f"skip {item.name}: {e}")
print(f"\n✓ Removed {removed} items, freed {freed/1024/1024:.1f} MB from {target}")