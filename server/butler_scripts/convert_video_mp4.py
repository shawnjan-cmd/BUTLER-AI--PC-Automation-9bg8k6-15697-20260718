import subprocess
from pathlib import Path
src = Path.home() / 'Videos' / 'in.mkv'   # <-- edit
if not src.exists(): print('Set src= a real file'); raise SystemExit
dst = src.with_suffix('.mp4')
cmd = ['ffmpeg','-y','-i',str(src),'-c:v','libx264','-crf','23','-preset','medium','-c:a','aac','-b:a','192k',str(dst)]
r = subprocess.run(cmd)
print(f'[exit {r.returncode}] -> {dst.name}')