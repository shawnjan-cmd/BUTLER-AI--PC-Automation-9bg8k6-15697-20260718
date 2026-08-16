from pathlib import Path
import json
try:
    import yaml
except ImportError:
    print('Install: pip install pyyaml'); raise SystemExit
n=0
for f in list(Path('.').glob('*.yaml'))+list(Path('.').glob('*.yml')):
    try:
        data=yaml.safe_load(f.read_text(encoding='utf-8'))
        out=f.with_suffix('.json'); out.write_text(json.dumps(data, indent=2, default=str), encoding='utf-8')
        print(f'✓ {f.name} -> {out.name}'); n+=1
    except Exception as e: print(f'✗ {f.name}: {e}')
print(f'\nConverted {n} files')