import subprocess, time, re
print('Monitoring WiFi for unexpected drops (30 sec)... Ctrl+C to stop')
stable_check = ['netsh','wlan','show','interfaces']
drops = 0
try:
    for i in range(30):
        r = subprocess.run(stable_check, capture_output=True, text=True, timeout=3)
        state_line = [l for l in r.stdout.splitlines() if 'State' in l]
        if state_line:
            state = state_line[0].split(':')[-1].strip()
            if state.lower() != 'connected':
                drops += 1
                print(f'  [{time.strftime("%H:%M:%S")}] DROP #{drops} — State: {state}')
            else:
                print(f'  [{time.strftime("%H:%M:%S")}] Connected ✓', end='\r')
        time.sleep(1)
except KeyboardInterrupt:
    pass
print(f'\n\nMonitoring complete. Drops detected: {drops}')
if drops > 2: print('⚠ Multiple drops — possible deauth attack or poor signal.')