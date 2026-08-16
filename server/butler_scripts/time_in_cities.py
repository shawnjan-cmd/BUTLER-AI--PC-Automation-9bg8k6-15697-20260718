import datetime
try:
    from zoneinfo import ZoneInfo
except ImportError:
    print('Python 3.9+ required'); raise SystemExit
zones=['UTC','America/Los_Angeles','America/New_York','Europe/London','Europe/Berlin','Asia/Dubai','Asia/Tokyo','Australia/Sydney']
for z in zones:
    try:
        t=datetime.datetime.now(ZoneInfo(z))
        print(f'  {z:25s} {t.strftime("%a %Y-%m-%d %H:%M %Z")}')
    except Exception as e: print(f'  {z}: {e}')