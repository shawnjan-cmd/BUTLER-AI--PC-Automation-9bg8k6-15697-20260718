import subprocess, sys
try:
    import qrcode
except ImportError:
    subprocess.check_call([sys.executable,'-m','pip','install','--quiet','qrcode']); import qrcode
ssid = input('SSID: ').strip(); pwd = input('Password: ').strip(); enc = input('WPA/WEP/nopass [WPA]: ').strip() or 'WPA'
payload = f'WIFI:T:{enc};S:{ssid};P:{pwd};;'
q = qrcode.QRCode(border=1); q.add_data(payload); q.make()
q.print_ascii(invert=True)