import time, sys
while True:
    time.sleep(20*60)
    msg = "🌿 Look 20 ft away for 20 seconds"
    print(f"\n{msg}")
    if sys.platform == "darwin":
        import subprocess
        subprocess.run(["osascript","-e",f'display notification "{msg}" with title "Eyes"'])