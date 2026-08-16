from pathlib import Path
ROOT = Path.cwd(); MAX_DEPTH = 3
def walk(p, depth=0):
    if depth > MAX_DEPTH: return
    items = sorted(p.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
    for i, c in enumerate(items):
        if c.name.startswith("."): continue
        last = i == len(items)-1
        print("  " * depth + ("└─ " if last else "├─ ") + c.name + ("/" if c.is_dir() else ""))
        if c.is_dir(): walk(c, depth+1)
print(ROOT)
walk(ROOT)