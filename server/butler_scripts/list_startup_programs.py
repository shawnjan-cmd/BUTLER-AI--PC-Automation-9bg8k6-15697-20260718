import sys, subprocess
if sys.platform != "win32":
    print("Windows only"); raise SystemExit
r = subprocess.run(["wmic", "startup", "get", "Caption,Command"],
                   capture_output=True, text=True)
print(r.stdout)