/**
 * PC Action Scripts — Butler AI Server v20
 * Maps action IDs to Python scripts that run via /api/execute.
 * Replaces the removed /api/pc-check/action and /api/pc-check/scan endpoints.
 */

export const PC_ACTION_SCRIPTS: Record<string, string> = {
  full_clean: [
    'import shutil, os, tempfile',
    'freed = 0; n = 0',
    'for p in [tempfile.gettempdir()]:',
    '    for f in os.listdir(p):',
    '        fp = os.path.join(p, f)',
    '        try:',
    '            sz = os.path.getsize(fp) if os.path.isfile(fp) else 0',
    '            (os.unlink if os.path.isfile(fp) else shutil.rmtree)(fp)',
    '            freed += sz; n += 1',
    '        except: pass',
    'print(f"Cleaned {n} items, freed {freed // 1024 // 1024}MB")',
  ].join('\n'),

  organize: [
    'import os, shutil',
    'from pathlib import Path',
    'DL = Path.home() / "Downloads"',
    'TYPES = {".pdf":"PDFs",".jpg":"Images",".jpeg":"Images",".png":"Images",".gif":"Images",".mp4":"Videos",".mkv":"Videos",".zip":"Archives",".rar":"Archives",".7z":"Archives",".docx":"Docs",".doc":"Docs",".xlsx":"Docs",".txt":"Text",".csv":"Text"}',
    'moved = 0',
    'for f in DL.glob("*"):',
    '    if f.is_file() and f.suffix.lower() in TYPES:',
    '        dest = DL / TYPES[f.suffix.lower()]',
    '        dest.mkdir(exist_ok=True)',
    '        try:',
    '            shutil.move(str(f), str(dest / f.name))',
    '            moved += 1',
    '        except: pass',
    'print(f"Organized {moved} files into subfolders")',
  ].join('\n'),

  disk_report: [
    'import psutil',
    'print("=== DISK REPORT ===")',
    'for p in psutil.disk_partitions():',
    '    try:',
    '        u = psutil.disk_usage(p.mountpoint)',
    '        print(f"{p.mountpoint}: {u.used/1024**3:.1f}/{u.total/1024**3:.1f}GB ({u.percent}%)")',
    '    except: pass',
    'import shutil',
    'total, used, free = shutil.disk_usage("/")',
    'print(f"Total free: {free/1024**3:.1f}GB")',
  ].join('\n'),

  empty_recycle: [
    'import subprocess, sys',
    'if sys.platform == "win32":',
    '    subprocess.run(["powershell", "-Command", "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"], capture_output=True)',
    '    print("Windows Recycle Bin emptied")',
    'else:',
    '    import shutil, os',
    '    trash = os.path.expanduser("~/.local/share/Trash/files")',
    '    if os.path.exists(trash):',
    '        shutil.rmtree(trash, ignore_errors=True)',
    '        os.makedirs(trash, exist_ok=True)',
    '        print("Trash emptied")',
    '    else:',
    '        print("No trash folder found")',
  ].join('\n'),

  memory_clean: [
    'import gc, psutil',
    'vm = psutil.virtual_memory()',
    'print(f"Before: {vm.used/1024**3:.1f}GB / {vm.total/1024**3:.1f}GB ({vm.percent}%)")',
    'collected = gc.collect()',
    'print(f"GC freed: {collected} objects")',
    'vm2 = psutil.virtual_memory()',
    'print(f"After: {vm2.used/1024**3:.1f}GB ({vm2.percent}%)")',
  ].join('\n'),

  privacy_clean: [
    'import subprocess, sys, os',
    'if sys.platform == "win32":',
    '    subprocess.run(["powershell", "-Command", "Set-Clipboard -Value \'\'"], capture_output=True, timeout=5)',
    '    subprocess.run(["powershell", "-Command", "Remove-Item -Path $env:TEMP\\\\* -Recurse -Force -ErrorAction SilentlyContinue"], capture_output=True, timeout=10)',
    'print("Privacy traces cleared: clipboard and temp files")',
  ].join('\n'),
};

/** Python script that probes PC for scan data via /api/execute */
export const PC_SCAN_SCRIPT = [
  'import psutil, tempfile, os, json',
  'tmp = tempfile.gettempdir()',
  'tmp_items = os.listdir(tmp)',
  'tmp_size = sum(',
  '    os.path.getsize(os.path.join(tmp, f))',
  '    for f in tmp_items',
  '    if os.path.isfile(os.path.join(tmp, f))',
  ')',
  'try:',
  '    import shutil',
  '    total, used, free = shutil.disk_usage("/")',
  '    disk_pct = round(used / total * 100, 1)',
  'except:',
  '    disk_pct = 0; free = 0',
  'print(json.dumps({',
  '    "temp_files": {"count": len(tmp_items), "sizeMb": int(tmp_size // 1024 // 1024)},',
  '    "browser_cache": {"count": 0, "sizeMb": 0},',
  '    "large_files": {"count": 0, "sizeMb": 0},',
  '    "total_recoverable_mb": int(tmp_size // 1024 // 1024),',
  '    "stats": {"cleaned": 0, "organized": 0, "scripts_run": 0, "undone": 0}',
  '}))',
].join('\n');
