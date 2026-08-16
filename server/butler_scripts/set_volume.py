try:
    from ctypes import cast, POINTER
    from comtypes import CLSCTX_ALL
    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
except ImportError:
    print('pip install pycaw comtypes'); raise SystemExit
LEVEL = 30   # 0-100
dev = AudioUtilities.GetSpeakers()
vol = cast(dev.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None), POINTER(IAudioEndpointVolume))
vol.SetMasterVolumeLevelScalar(LEVEL/100, None)
print(f'[OK] Volume set to {LEVEL}%')