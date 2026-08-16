from pathlib import Path
src = Path.home() / 'Downloads' / 'big.iso'   # <-- edit me
if not src.exists(): print(f'Set src= a real file (current: {src})'); raise SystemExit
chunk = 100*1024*1024  # 100 MB
i = 0
with src.open('rb') as f:
    while True:
        buf = f.read(chunk)
        if not buf: break
        out = src.with_name(f'{src.name}.part{i:03d}')
        out.write_bytes(buf)
        print(f'  wrote {out.name} ({len(buf)/1024/1024:.1f} MB)')
        i += 1
print(f'[OK] Split into {i} parts')