import subprocess
r = subprocess.run(['nvidia-smi','--query-compute-apps=pid,process_name,used_memory','--format=csv'], capture_output=True, text=True)
if r.returncode != 0: print('nvidia-smi not available'); raise SystemExit
print(r.stdout)