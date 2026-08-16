import subprocess
r = subprocess.run(['netsh','advfirewall','firewall','show','rule','name=all','dir=in','status=enabled'], capture_output=True, text=True)
rules = [l.strip() for l in r.stdout.splitlines() if l.strip()]
print(f'Enabled inbound rules ({len([l for l in rules if l.startswith("Rule Name")])} total):\n')
print(r.stdout[:6000])