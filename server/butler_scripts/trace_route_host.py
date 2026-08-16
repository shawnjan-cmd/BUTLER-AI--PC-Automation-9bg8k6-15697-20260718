import subprocess
host = input('Host (e.g. google.com): ').strip() or 'google.com'
print(subprocess.run(['tracert','-d','-h','20',host], capture_output=True, text=True).stdout)