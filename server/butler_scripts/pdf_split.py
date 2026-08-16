from pathlib import Path
try:
    from pypdf import PdfReader, PdfWriter
except ImportError:
    print('Install: pip install pypdf'); raise SystemExit
src=Path('input.pdf')
if not src.exists(): print('Place input.pdf in current dir'); raise SystemExit
r=PdfReader(str(src))
for i,page in enumerate(r.pages,1):
    w=PdfWriter(); w.add_page(page)
    out=Path(f'page_{i:03d}.pdf'); w.write(str(out))
    print(f'  {out.name}')
print(f'\n✓ split into {len(r.pages)} pages')