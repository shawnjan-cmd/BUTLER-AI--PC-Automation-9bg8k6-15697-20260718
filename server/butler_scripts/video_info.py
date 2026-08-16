import subprocess, json
from pathlib import Path
video = Path.home() / 'Videos' / 'sample.mp4'   # <-- edit
if not video.exists(): print(f'Set video= a real file (current: {video})'); raise SystemExit
r = subprocess.run(['ffprobe','-v','quiet','-print_format','json','-show_format','-show_streams',str(video)], capture_output=True, text=True)
if r.returncode != 0: print('Install ffmpeg/ffprobe'); raise SystemExit
d = json.loads(r.stdout); fmt = d['format']
print(f'File    : {video.name}')
print(f'Duration: {float(fmt.get("duration",0)):.1f}s')
print(f'Size    : {int(fmt.get("size",0))/1024/1024:.1f} MB')
print(f'Bitrate : {int(fmt.get("bit_rate",0))/1000:.0f} kbps')
for s in d['streams']:
    if s['codec_type']=='video':
        print(f'Video   : {s["codec_name"]} {s.get("width")}x{s.get("height")} @ {s.get("r_frame_rate")}')
    elif s['codec_type']=='audio':
        print(f'Audio   : {s["codec_name"]} {s.get("sample_rate")}Hz {s.get("channels")}ch')