import subprocess
from pathlib import Path
src = Path.home() / 'Videos' / 'in.mp4'   # <-- edit
if not src.exists(): print('Set src= a real file'); raise SystemExit
dst = src.with_suffix('.mp3')
r = subprocess.run(['ffmpeg','-y','-i',str(src),'-vn','-b:a','192k',str(dst)])
print(f'[exit {r.returncode}] -> {dst.name}')