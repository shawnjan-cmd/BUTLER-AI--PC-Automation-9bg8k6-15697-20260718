try: import pyautogui
except ImportError: print('pip install pyautogui'); raise SystemExit
import time
print('Jiggling for 30 minutes (Ctrl+C to stop)...')
end = time.time() + 1800
while time.time() < end:
    x, y = pyautogui.position()
    pyautogui.moveTo(x+1, y); pyautogui.moveTo(x, y)
    time.sleep(30)
print('[done]')