import subprocess, sys
if sys.platform != "win32":
    print("Windows only"); raise SystemExit
r = subprocess.run(["netsh", "wlan", "show", "profiles"], capture_output=True, text=True)
print(r.stdout)