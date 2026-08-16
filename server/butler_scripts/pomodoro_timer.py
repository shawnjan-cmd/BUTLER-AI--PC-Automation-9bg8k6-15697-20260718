import time, sys, subprocess
MINUTES = 25
end = time.time() + MINUTES*60
print(f"⏱  Pomodoro started — {MINUTES} min focus")
try:
    while time.time() < end:
        left = int(end - time.time())
        m, s = divmod(left, 60)
        print(f"\r  {m:02}:{s:02}  remaining", end="", flush=True)
        time.sleep(1)
    print("\n\n✓ Pomodoro complete — take a 5 min break!")
    if sys.platform == "win32":
        import winsound; winsound.MessageBeep()
    elif sys.platform == "darwin":
        subprocess.run(["osascript","-e",'display notification "Pomodoro complete!" with title "Butler AI"'])
except KeyboardInterrupt:
    print("\nstopped")