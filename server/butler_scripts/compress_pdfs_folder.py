import subprocess, shutil, sys
from pathlib import Path
gs = shutil.which('gswin64c') or shutil.which('gs')
if not gs:
    print('Install Ghostscript first (winget install ArtifexSoftware.GhostScript).'); sys.exit(1)
for f in Path('.').glob('*.pdf'):
    out = f.with_name(f.stem + '_compressed.pdf')
    r = subprocess.run([gs,'-sDEVICE=pdfwrite','-dCompatibilityLevel=1.4',
         '-dPDFSETTINGS=/ebook','-dNOPAUSE','-dQUIET','-dBATCH',
         f'-sOutputFile={out}', str(f)], capture_output=True, text=True)
    if r.returncode == 0:
        b, a = f.stat().st_size, out.stat().st_size
        print(f'{f.name}: {b/1024/1024:.1f} -> {a/1024/1024:.1f} MB')
    else: print(f'FAIL {f.name}: {r.stderr[:200]}')