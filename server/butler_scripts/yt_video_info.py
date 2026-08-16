import subprocess, sys, json
try:
    import yt_dlp
except ImportError:
    subprocess.check_call([sys.executable,'-m','pip','install','--quiet','yt-dlp']); import yt_dlp
url = input('Video URL: ').strip()
if not url: sys.exit(0)
with yt_dlp.YoutubeDL({'quiet': True, 'skip_download': True}) as y:
    i = y.extract_info(url, download=False)
for k in ('title','uploader','duration','view_count','like_count','upload_date'):
    print(f'{k:>12}: {i.get(k,"")}')