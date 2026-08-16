import subprocess, re
r = subprocess.run(['pnputil','/enum-devices','/class','HIDClass'], capture_output=True, text=True)
devices = r.stdout
print('=== HID Devices ===\n')
print(devices[:4000])
keyboards = [l for l in devices.splitlines() if 'keyboard' in l.lower()]
print(f'\nKeyboard-type HID devices found: {len(keyboards)}')
for k in keyboards: print(' ', k)
if len(keyboards) > 2:
    print('\n⚠ WARNING: More than 2 keyboard-type HID devices — verify each is legitimate!')