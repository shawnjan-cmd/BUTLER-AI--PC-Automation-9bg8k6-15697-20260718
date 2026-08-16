from pathlib import Path
try:
    from pypdf import PdfWriter
except ImportError:
    print('Install: pip install pypdf'); raise SystemExit
pdfs=sorted(Path('.').glob('*.pdf'))
pdfs=[p for p in pdfs if p.name.lower()!='merged.pdf']
if not pdfs: print('No PDFs'); raise SystemExit
w=PdfWriter()
for p in pdfs: w.append(str(p)); print(f'  + {p.name}')
w.write('merged.pdf'); w.close()
print(f'\n✓ merged.pdf ({len(pdfs)} files)')