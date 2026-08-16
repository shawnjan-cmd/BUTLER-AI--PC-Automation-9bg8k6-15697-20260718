import subprocess
for cmd in [['ipconfig','/flushdns'],['netsh','winsock','reset'],['netsh','int','ip','reset']]:
    print('>',' '.join(cmd)); print(subprocess.run(cmd, capture_output=True, text=True).stdout)
print('Reboot recommended.')