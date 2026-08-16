import shutil
from pathlib import Path
ROOT = Path.home() / "Downloads"
TYPES = {
    "Images":   {".jpg",".jpeg",".png",".gif",".webp",".svg",".bmp",".heic"},
    "Videos":   {".mp4",".mov",".mkv",".avi",".webm",".m4v"},
    "Audio":    {".mp3",".wav",".flac",".m4a",".ogg",".aac"},
    "Docs":     {".pdf",".docx",".doc",".txt",".md",".odt",".rtf",".xlsx",".csv",".pptx"},
    "Archives": {".zip",".rar",".7z",".tar",".gz",".bz2"},
    "Code":     {".py",".js",".ts",".tsx",".html",".css",".json",".sh",".go",".rs",".java"},
    "Installers": {".exe",".msi",".dmg",".pkg",".deb",".rpm",".apk"},
}
moved = 0
for f in ROOT.iterdir():
    if not f.is_file(): continue
    dst = "Other"
    for k, exts in TYPES.items():
        if f.suffix.lower() in exts: dst = k; break
    target = ROOT / dst; target.mkdir(exist_ok=True)
    try: shutil.move(str(f), str(target / f.name)); moved += 1
    except Exception as e: print(f"skip {f.name}: {e}")
print(f"✓ {moved} files organized in {ROOT}")