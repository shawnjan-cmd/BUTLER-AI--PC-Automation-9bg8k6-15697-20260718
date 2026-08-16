import platform, subprocess
if platform.system()=='Windows':
    out=subprocess.run(['wmic','printer','get','Name,Default,PortName,PrinterStatus','/format:list'], capture_output=True, text=True).stdout
    print(out.strip() or 'No printers')
else:
    out=subprocess.run(['lpstat','-p','-d'], capture_output=True, text=True).stdout
    print(out or 'No printers / lpstat not found')