import platform, subprocess
if platform.system()=='Windows':
    print('--- Baseboard ---')
    print(subprocess.run(['wmic','baseboard','get','Manufacturer,Product,SerialNumber,Version','/format:list'],capture_output=True,text=True).stdout.strip())
    print('--- BIOS ---')
    print(subprocess.run(['wmic','bios','get','Manufacturer,SMBIOSBIOSVersion,ReleaseDate','/format:list'],capture_output=True,text=True).stdout.strip())
else:
    for f in ('/sys/class/dmi/id/board_vendor','/sys/class/dmi/id/board_name','/sys/class/dmi/id/bios_version'):
        try: print(f, '=', open(f).read().strip())
        except Exception: pass