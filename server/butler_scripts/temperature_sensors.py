try: import psutil
except ImportError: print('pip install psutil'); raise SystemExit
if not hasattr(psutil, 'sensors_temperatures'):
    print('Sensors API not available on this OS'); raise SystemExit
temps = psutil.sensors_temperatures()
if not temps: print('No temperature sensors readable'); raise SystemExit
for name, entries in temps.items():
    print(f'\n[{name}]')
    for e in entries:
        bar = '#' * int((e.current or 0) / 5)
        print(f'  {e.label or name:20s} {e.current:5.1f}\u00b0C  {bar}')