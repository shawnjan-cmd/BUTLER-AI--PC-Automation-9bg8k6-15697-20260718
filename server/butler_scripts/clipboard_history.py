import platform, subprocess
sys_ = platform.system()
try:
    if sys_ == 'Windows':
        import ctypes; user32 = ctypes.windll.user32
        user32.OpenClipboard(0); user32.EmptyClipboard(); user32.CloseClipboard()
    elif sys_ == 'Darwin':
        subprocess.run(['pbcopy'], input=b'')
    else:
        subprocess.run(['xclip','-selection','clipboard'], input=b'')
    print('[OK] Clipboard cleared')
except Exception as e: print(f'[ERR] {e}')