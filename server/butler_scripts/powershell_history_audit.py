import re
from pathlib import Path
hist_file = Path.home() / 'AppData/Roaming/Microsoft/Windows/PowerShell/PSReadLine/ConsoleHost_history.txt'
if not hist_file.exists():
    print(f'History file not found: {hist_file}'); raise SystemExit
lines = hist_file.read_text(errors='replace').splitlines()
print(f'Last 50 PowerShell commands ({len(lines)} total):\n')
for l in lines[-50:]: print(' ', l)
SUSPICIOUS = ['invoke-expression','iex ','downloadstring','webclient','bypass','encodedcommand','-enc ','base64','shellcode','mimikatz','meterpreter']
print('\n=== Suspicious Commands ===')
for l in lines:
    for s in SUSPICIOUS:
        if s in l.lower():
            print(f'  ⚠ {l}'); break