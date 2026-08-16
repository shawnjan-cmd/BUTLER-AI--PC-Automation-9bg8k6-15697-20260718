import subprocess, platform, time
print('Restarting in 5 seconds... Ctrl+C to abort')
for i in range(5,0,-1): print(i); time.sleep(1)
if platform.system()=='Windows': subprocess.run(['shutdown','/r','/t','0'])
else: subprocess.run(['shutdown','-r','now'])