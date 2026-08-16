import subprocess, time, re
def get_battery():
    try:
        import psutil
        b = psutil.sensors_battery()
        return b.percent, b.power_plugged if b else (None, None)
    except:
        pass
    r = subprocess.run(['wmic','path','Win32_Battery','get','EstimatedChargeRemaining,BatteryStatus','/format:list'], capture_output=True, text=True)
    pct_m = re.search(r'EstimatedChargeRemaining=(\d+)', r.stdout)
    return (int(pct_m.group(1)), False) if pct_m else (None, None)
print('Battery Discharge Monitor (60 seconds)...')
start_pct, plugged = get_battery()
if start_pct is None:
    print('No battery found (desktop PC or driver issue)'); raise SystemExit
print(f'Start: {start_pct}%  Plugged: {plugged}')
time.sleep(60)
end_pct, _ = get_battery()
if end_pct is None: raise SystemExit
diff = start_pct - end_pct
print(f'End:   {end_pct}%')
print(f'Delta: {diff:+.1f}% per minute → ~{diff*60:.0f}%/hour')
if diff > 0 and start_pct > 0:
    hrs_left = end_pct / (diff*60)
    print(f'Estimated battery life: {hrs_left:.1f} hours')