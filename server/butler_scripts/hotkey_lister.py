import subprocess
ps = (
    "Add-Type -TypeDefinition @'"
    "using System; using System.Runtime.InteropServices;"
    "public class HotkeyHelper {"
    "  [DllImport(\"user32.dll\")] public static extern bool RegisterHotKey(IntPtr h, int id, uint mod, uint vk);"
    "  [DllImport(\"user32.dll\")] public static extern bool UnregisterHotKey(IntPtr h, int id);"
    "}'@; "
    "$used = @(); for ($i=1; $i -le 500; $i++) {"
    "  for ($vk=1; $vk -le 255; $vk++) {"
    "    for ($mod=0; $mod -le 15; $mod++) {"
    "      if ([HotkeyHelper]::RegisterHotKey([IntPtr]::Zero, $i, $mod, $vk)) {"
    "        [HotkeyHelper]::UnregisterHotKey([IntPtr]::Zero, $i)"
    "      } else {"
    "        $used += \"MOD:$mod VK:$vk\""
    "      }}}}"
    "$used | Get-Unique | Select-Object -First 50"
)
print('Registered global hotkeys (first 50):')
r = subprocess.run(['powershell','-NoProfile','-Command', ps], capture_output=True, text=True, timeout=30)
print(r.stdout[:3000] or 'None found or scan timed out.')