try:
    from ctypes import cast, POINTER
    from comtypes import CLSCTX_ALL
    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
except ImportError:
    print('Install: pip install pycaw comtypes'); raise SystemExit
dev = AudioUtilities.GetSpeakers()
iface = dev.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
vol = cast(iface, POINTER(IAudioEndpointVolume))
new = 0 if vol.GetMute() else 1
vol.SetMute(new, None)
print(f"✓ {'Muted' if new else 'Unmuted'}")