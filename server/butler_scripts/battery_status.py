try:
    import psutil
    b = psutil.sensors_battery()
    if b is None:
        print("No battery detected (desktop?)")
    else:
        sec = b.secsleft
        rem = "plugged in" if sec == psutil.POWER_TIME_UNLIMITED else (
              "unknown" if sec == psutil.POWER_TIME_UNKNOWN else f"{sec//3600}h {sec%3600//60}m")
        print(f"Battery : {b.percent:.0f}%   {'⚡ charging' if b.power_plugged else '🔋 on battery'}")
        print(f"Left    : {rem}")
except ImportError:
    print("pip install psutil")