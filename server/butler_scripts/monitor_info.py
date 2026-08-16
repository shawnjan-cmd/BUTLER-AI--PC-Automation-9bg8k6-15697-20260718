import platform, subprocess
if platform.system()=='Windows':
    out = subprocess.run(['wmic','path','Win32_VideoController','get','Name,CurrentHorizontalResolution,CurrentVerticalResolution,CurrentRefreshRate','/format:list'], capture_output=True, text=True).stdout
    print(out.strip() or 'No info')
else:
    try:
        import tkinter as tk
        r=tk.Tk(); print(f'Primary: {r.winfo_screenwidth()}x{r.winfo_screenheight()}'); r.destroy()
    except Exception as e: print(e)