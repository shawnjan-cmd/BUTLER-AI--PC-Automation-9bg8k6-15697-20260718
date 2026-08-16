import ctypes, ctypes.wintypes, struct, re, sys
pid = input('PID to dump strings from: ').strip()
try:
    pid = int(pid)
except ValueError:
    print('Invalid PID'); sys.exit(1)
MIN_LEN = 6
kern = ctypes.windll.kernel32
PROCESS_VM_READ = 0x0010
PROCESS_QUERY_INFORMATION = 0x0400
h = kern.OpenProcess(PROCESS_VM_READ|PROCESS_QUERY_INFORMATION, False, pid)
if not h:
    print('Could not open process (try running as admin)'); sys.exit(1)
class MEMORY_BASIC_INFORMATION(ctypes.Structure):
    _fields_ = [('BaseAddress',ctypes.c_void_p),('AllocationBase',ctypes.c_void_p),
                ('AllocationProtect',ctypes.wintypes.DWORD),('RegionSize',ctypes.c_size_t),
                ('State',ctypes.wintypes.DWORD),('Protect',ctypes.wintypes.DWORD),
                ('Type',ctypes.wintypes.DWORD)]
MBI_SIZE = ctypes.sizeof(MEMORY_BASIC_INFORMATION)
mbi = MEMORY_BASIC_INFORMATION()
addr = 0; found = []
while addr < 0x7FFFFFFF:
    if kern.VirtualQueryEx(h, ctypes.c_void_p(addr), ctypes.byref(mbi), MBI_SIZE) == 0: break
    if mbi.State == 0x1000 and mbi.Protect not in (0x01,0x10):
        buf = (ctypes.c_char * mbi.RegionSize)()
        read = ctypes.c_size_t(0)
        if kern.ReadProcessMemory(h, ctypes.c_void_p(addr), buf, mbi.RegionSize, ctypes.byref(read)):
            data = bytes(buf[:read.value])
            for m in re.finditer(b'[\x20-\x7E]{'+str(MIN_LEN).encode()+b',}', data):
                s = m.group().decode('ascii','replace')
                if any(kw in s.lower() for kw in ['password','token','secret','key','http','cmd','exec','eval']):
                    found.append(s)
    addr += mbi.RegionSize or 1
kern.CloseHandle(h)
print(f'Interesting strings found: {len(found)}')
for s in found[:100]: print(' ', s)