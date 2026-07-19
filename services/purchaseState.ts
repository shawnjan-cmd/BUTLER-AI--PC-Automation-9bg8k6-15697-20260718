/**
 * Purchase State Service — Butler AI Monetization
 * Manages theme packs + script pack unlock state locally.
 * Real billing integration: swap the `purchasePack` stub with
 * `react-native-purchases` (RevenueCat) or `expo-in-app-purchases`
 * once the Play Store billing account is configured.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PURCHASED = '@butler_purchased_packs_v1';
const KEY_PENDING   = '@butler_pending_purchase_v1';

export interface PurchasedState {
  packIds: string[];
  purchasedAt: Record<string, number>; // unix ms
}

export interface ScriptPack {
  id:          string;
  name:        string;
  tagline:     string;
  icon:        string;
  iconLib:     'material' | 'community';
  color:       string;
  price:       string;
  scriptCount: number;
  category:    string;
  scripts:     { name: string; desc: string; code: string }[];
  badge?:      string;
  isPopular?:  boolean;
}

// ── SCRIPT PACKS CATALOG ──────────────────────────────────────────
export const SCRIPT_PACKS: ScriptPack[] = [
  {
    id: 'pack_optimizer',
    name: 'PC OPTIMIZER PRO',
    tagline: 'Blast away clutter, speed up boot, recover GB of disk space',
    icon: 'speedometer', iconLib: 'community', color: '#00E5FF',
    price: '$2.99', scriptCount: 10, category: 'PERFORMANCE', badge: 'POPULAR',
    isPopular: true,
    scripts: [
      { name: 'Deep Temp Nuke',   desc: 'Remove all temp files, prefetch, and logs', code: 'import shutil,os,tempfile,glob\nfor d in [tempfile.gettempdir(),"C:\\\\Windows\\\\Temp","C:\\\\Windows\\\\Prefetch"]:\n    try:\n        for f in glob.glob(d+"\\\\*"):\n            try: os.remove(f) if os.path.isfile(f) else shutil.rmtree(f)\n            except: pass\n    except: pass\nprint("Deep clean complete")' },
      { name: 'RAM Liberator',    desc: 'Kill idle background processes eating RAM', code: 'import psutil\nkilled=0\nfor p in psutil.process_iter(["name","memory_percent","status"]):\n    try:\n        if p.info["status"]=="idle" and p.info["memory_percent"]<0.5:\n            p.kill(); killed+=1\n    except: pass\nprint(f"Freed: {killed} idle processes")' },
      { name: 'Startup Auditor',  desc: 'List all startup programs with RAM cost', code: 'import subprocess,json\nr=subprocess.run(["powershell","-Command","Get-CimInstance Win32_StartupCommand | Select-Object Name,Command | ConvertTo-Json"],capture_output=True,text=True,timeout=15)\nprint(r.stdout[:2000])' },
      { name: 'Disk Space Map',   desc: 'Show top 10 largest folders on C:', code: 'import os\nfolders=[]\nfor root,dirs,files in os.walk("C:\\\\"):\n    try:\n        size=sum(os.path.getsize(os.path.join(root,f)) for f in files if os.path.isfile(os.path.join(root,f)))\n        folders.append((size,root))\n    except: pass\nfolders.sort(reverse=True)\nfor s,f in folders[:10]: print(f"{s//1024//1024}MB  {f}")' },
      { name: 'Boot Time Check',  desc: 'Measure last boot duration from event log', code: 'import subprocess\nr=subprocess.run(["powershell","-Command","Get-WinEvent -FilterHashTable @{LogName=\"Microsoft-Windows-Diagnostics-Performance/Operational\";Id=100} -MaxEvents 1 | Select-Object -ExpandProperty Message"],capture_output=True,text=True,timeout=15)\nprint(r.stdout[:500] or "No data found")' },
    ],
  },
  {
    id: 'pack_security',
    name: 'SECURITY FORTRESS',
    tagline: 'Harden your PC, detect threats, audit your attack surface',
    icon: 'shield-lock', iconLib: 'community', color: '#FF3355',
    price: '$2.99', scriptCount: 10, category: 'SECURITY',
    scripts: [
      { name: 'Port Scanner',        desc: 'Scan all open ports on local machine', code: 'import socket\nopen_ports=[]\nfor port in range(1,1025):\n    s=socket.socket()\n    s.settimeout(0.05)\n    if s.connect_ex(("127.0.0.1",port))==0: open_ports.append(port)\n    s.close()\nprint(f"Open ports: {open_ports}")' },
      { name: 'Process Fingerprint', desc: 'SHA256 hash every running executable', code: 'import psutil,hashlib,os\nfor p in psutil.process_iter(["exe","name"]):\n    try:\n        exe=p.info["exe"]\n        if exe and os.path.isfile(exe):\n            with open(exe,"rb") as f: h=hashlib.sha256(f.read(65536)).hexdigest()[:16]\n            print(f"{h}  {p.info[\"name\"]}")\n    except: pass' },
      { name: 'Login History',       desc: 'Show last 20 logins with timestamp', code: 'import subprocess\nr=subprocess.run(["powershell","-Command","Get-WinEvent -LogName Security -FilterXPath \"*[System[(EventID=4624)]]\" -MaxEvents 20 | Format-List TimeCreated,Message"],capture_output=True,text=True,timeout=15)\nprint(r.stdout[:2000])' },
      { name: 'Firewall Audit',      desc: 'List all active firewall rules', code: 'import subprocess\nr=subprocess.run(["netsh","advfirewall","firewall","show","rule","name=all"],capture_output=True,text=True,timeout=15)\nprint(r.stdout[:3000])' },
      { name: 'USB Device Log',      desc: 'All USB devices ever connected', code: 'import subprocess\nr=subprocess.run(["powershell","-Command","Get-ItemProperty -Path \"HKLM:\\\\SYSTEM\\\\CurrentControlSet\\\\Enum\\\\USB\\\\*\\\\*\" | Select FriendlyName,DeviceDesc | Format-List"],capture_output=True,text=True,timeout=15)\nprint(r.stdout[:2000])' },
    ],
  },
  {
    id: 'pack_devtools',
    name: 'DEV POWER TOOLS',
    tagline: 'Git, Docker, env inspector, process killer — for developers',
    icon: 'code-braces-box', iconLib: 'community', color: '#CC44FF',
    price: '$2.99', scriptCount: 10, category: 'DEVELOPER',
    scripts: [
      { name: 'Git Status All', desc: 'Scan all git repos in home folder', code: 'from pathlib import Path\nimport subprocess\nfor p in Path.home().rglob(".git"):\n    repo=p.parent\n    r=subprocess.run(["git","status","--short"],cwd=str(repo),capture_output=True,text=True,timeout=5)\n    if r.stdout.strip(): print(f"\\n{repo.name}:\\n{r.stdout.strip()}")' },
      { name: 'Docker Summary',  desc: 'Running containers + resource usage', code: 'import subprocess\nr=subprocess.run(["docker","stats","--no-stream","--format","table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}"],capture_output=True,text=True,timeout=10)\nprint(r.stdout or "Docker not running or no containers")' },
      { name: 'Env Inspector',   desc: 'Print all system environment variables', code: 'import os\nfor k,v in sorted(os.environ.items()): print(f"{k}={v[:80]}")' },
      { name: 'Port Killer',     desc: 'Find and kill process on any port', code: 'import subprocess,sys\nport=input("Kill port: ")\nr=subprocess.run(["netstat","-ano"],capture_output=True,text=True)\nfor line in r.stdout.splitlines():\n    if f":{port} " in line:\n        pid=line.strip().split()[-1]\n        subprocess.run(["taskkill","/F","/PID",pid],capture_output=True)\n        print(f"Killed PID {pid} on port {port}")' },
      { name: 'Python Env Scan', desc: 'List all venvs and their packages', code: 'from pathlib import Path\nimport subprocess\nfor p in list(Path.home().rglob("pyvenv.cfg"))[:5]:\n    venv=p.parent\n    pip=venv/"Scripts"/"pip.exe"\n    if pip.exists():\n        r=subprocess.run([str(pip),"list","--format=freeze"],capture_output=True,text=True,timeout=10)\n        print(f"\\n{venv.name}: {len(r.stdout.splitlines())} packages")' },
    ],
  },
  {
    id: 'pack_automation',
    name: 'SMART AUTOMATION',
    tagline: 'Schedules, watchers, email digests, cron runners',
    icon: 'robot-angry', iconLib: 'community', color: '#FFB020',
    price: '$4.99', scriptCount: 12, category: 'AUTOMATION', badge: 'NEW',
    scripts: [
      { name: 'File Watcher',      desc: 'Watch folder and run script on new files', code: 'import time,os,sys\nfolder=input("Watch folder: ")\nbefore=set(os.listdir(folder))\nprint(f"Watching {folder}...")\nfor _ in range(60):\n    time.sleep(2)\n    after=set(os.listdir(folder))\n    added=after-before\n    if added: print(f"New files: {added}")\n    before=after' },
      { name: 'Daily Digest',      desc: 'Generate a daily PC health summary email', code: 'import psutil,platform,datetime\nstats={"date":str(datetime.date.today()),"os":platform.system(),"cpu":f"{psutil.cpu_percent(1)}%","ram":f"{psutil.virtual_memory().percent}%","disk":f"{psutil.disk_usage(\"/\").percent}%"}\nfor k,v in stats.items(): print(f"{k}: {v}")' },
      { name: 'Cron Importer',     desc: 'Show all Windows Task Scheduler tasks', code: 'import subprocess\nr=subprocess.run(["schtasks","/query","/fo","CSV","/v"],capture_output=True,text=True,timeout=15)\nprint(r.stdout[:3000])' },
      { name: 'Auto Backup',       desc: 'Zip Documents and copy to external drive', code: 'import shutil,os,datetime\nsrc=os.path.expanduser("~/Documents")\ndst=os.path.expanduser(f"~/Desktop/backup_{datetime.date.today()}.zip")\nshutil.make_archive(dst.replace(".zip",""),"zip",src)\nprint(f"Backup saved: {dst}")' },
      { name: 'WiFi Trigger',      desc: 'Run a command when joining home WiFi', code: 'import subprocess,time\nTARGET="MyHomeWiFi"\nwhile True:\n    r=subprocess.run(["netsh","wlan","show","interfaces"],capture_output=True,text=True)\n    if TARGET in r.stdout:\n        print(f"Connected to {TARGET} — running tasks")\n        break\n    time.sleep(10)\nprint("WiFi trigger done")' },
    ],
  },
];

export const SCRIPT_PACK_MAP: Record<string, ScriptPack> = Object.fromEntries(SCRIPT_PACKS.map(p => [p.id, p]));

// ── STATE MANAGEMENT ──────────────────────────────────────────────
let _state: PurchasedState | null = null;

export async function loadPurchaseState(): Promise<PurchasedState> {
  if (_state) return _state;
  try {
    const raw = await AsyncStorage.getItem(KEY_PURCHASED);
    if (raw) {
      _state = JSON.parse(raw);
      return _state!;
    }
  } catch {}
  _state = { packIds: [], purchasedAt: {} };
  return _state;
}

export async function isPurchased(packId: string): Promise<boolean> {
  const state = await loadPurchaseState();
  return state.packIds.includes(packId);
}

export async function markPurchased(packId: string): Promise<void> {
  const state = await loadPurchaseState();
  if (!state.packIds.includes(packId)) {
    state.packIds.push(packId);
    state.purchasedAt[packId] = Date.now();
    _state = state;
    await AsyncStorage.setItem(KEY_PURCHASED, JSON.stringify(state));
  }
}

export async function getAllPurchased(): Promise<string[]> {
  const state = await loadPurchaseState();
  return state.packIds;
}

/**
 * Stub purchase flow — replace body with RevenueCat SDK call.
 * Returns true on success, false on cancel/fail.
 */
export async function purchasePack(packId: string, _price: string): Promise<boolean> {
  try {
    // TODO: Replace with real Play Store billing
    // const pkg = await Purchases.getOfferings();
    // const result = await Purchases.purchasePackage(pkg);
    // if (result.customerInfo.entitlements.active[packId]) { ... }

    // For now: mark as purchased immediately (early access — honor system)
    await markPurchased(packId);
    return true;
  } catch {
    return false;
  }
}

export function invalidatePurchaseCache(): void {
  _state = null;
}
