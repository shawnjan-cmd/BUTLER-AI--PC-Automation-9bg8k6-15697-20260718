import subprocess, sys
try:
    import qrcode
except ImportError:
    subprocess.check_call([sys.executable,'-m','pip','install','--quiet','qrcode']); import qrcode
txt = input('Text or URL: ').strip() or 'https://example.com'
q = qrcode.QRCode(border=1); q.add_data(txt); q.make()
q.print_ascii(invert=True)