from pathlib import Path
try:
    import markdown
except ImportError:
    print('Install: pip install markdown'); raise SystemExit
CSS='<style>body{font-family:-apple-system,sans-serif;max-width:780px;margin:2em auto;padding:0 1em;line-height:1.55;color:#222}code{background:#f4f4f4;padding:2px 5px;border-radius:3px}pre{background:#f4f4f4;padding:1em;overflow:auto}</style>'
n=0
for f in Path('.').glob('*.md'):
    html=markdown.markdown(f.read_text(encoding='utf-8'), extensions=['fenced_code','tables'])
    out=f.with_suffix('.html'); out.write_text(CSS+html, encoding='utf-8')
    print(f'  {f.name} -> {out.name}'); n+=1
print(f'\n✓ Converted {n} files')