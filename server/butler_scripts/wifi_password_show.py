import subprocess, platform, re
if platform.system() != 'Windows': print('Windows only (use Keychain on macOS)'); raise SystemExit
r = subprocess.run(['netsh','wlan','show','interfaces'], capture_output=True, text=True)
m = re.search(r'SSID\s*:\s*(.+)', r.stdout)
ssid = (m.group(1).strip() if m else None)
if not ssid: print('Not connected to Wi-Fi'); raise SystemExit
p = subprocess.run(['netsh','wlan','show','profile',f'name={ssid}','key=clear'], capture_output=True, text=True)
m = re.search(r'Key Content\s*:\s*(.+)', p.stdout)
print(f'SSID    : {ssid}')
print(f'Password: {m.group(1).strip() if m else "(none / open network)"}')