import subprocess, re
from collections import Counter
print('Scanning nearby WiFi networks...\n')
r = subprocess.run(['netsh','wlan','show','networks','mode=bssid'], capture_output=True, text=True)
print(r.stdout[:5000])
# Channel congestion analysis
channels = re.findall(r'Channel\s*:\s*(\d+)', r.stdout)
if channels:
    counts = Counter(int(c) for c in channels)
    print('\n=== Channel Congestion ===')
    for ch, cnt in sorted(counts.items()):
        bar = '█' * cnt
        print(f'  Ch {ch:3}: {bar} ({cnt} networks)')
    least = min(counts, key=counts.get)
    print(f'\n✓ Least congested: Channel {least}')