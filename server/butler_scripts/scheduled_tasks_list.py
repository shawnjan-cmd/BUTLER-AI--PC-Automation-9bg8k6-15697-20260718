import platform, subprocess
if platform.system()!='Windows': print('Windows only'); raise SystemExit
r=subprocess.run(['schtasks','/query','/fo','CSV','/nh'], capture_output=True, text=True)
import csv, io
rows=list(csv.reader(io.StringIO(r.stdout)))
shown=0
for row in rows:
    if len(row)>=3 and row[2].strip().lower() not in ('disabled','',):
        print(f'  {row[0][:60]:60s} next: {row[1]}')
        shown+=1
print(f'\n✓ {shown} enabled tasks')