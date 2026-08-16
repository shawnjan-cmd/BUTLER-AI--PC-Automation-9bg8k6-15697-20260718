from pathlib import Path
src = Path.cwd() / '.env'
if not src.exists(): print('No .env in current dir'); raise SystemExit
dst = src.with_name('.env.example')
out = []
for line in src.read_text().splitlines():
    if not line.strip() or line.strip().startswith('#'): out.append(line); continue
    if '=' in line: out.append(line.split('=',1)[0] + '=')
    else: out.append(line)
dst.write_text('\n'.join(out) + '\n')
print(f'[OK] {dst.name} ({len(out)} lines)')