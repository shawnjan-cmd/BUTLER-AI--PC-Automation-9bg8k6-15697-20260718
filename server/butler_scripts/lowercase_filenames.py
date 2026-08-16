from pathlib import Path
n=0
for f in Path('.').iterdir():
    if f.is_file():
        new=f.with_name(f.name.lower())
        if new==f: continue
        if new.exists(): print(f'  skip {f.name} (collision)'); continue
        f.rename(new); n+=1; print(f'  {f.name} -> {new.name}')
print(f'\n✓ Renamed {n} files')