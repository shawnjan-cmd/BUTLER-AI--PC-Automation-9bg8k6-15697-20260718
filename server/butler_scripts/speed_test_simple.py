import urllib.request, time
URL = "https://speed.cloudflare.com/__down?bytes=5000000"
print("Downloading 5 MB sample…")
t0 = time.perf_counter()
with urllib.request.urlopen(URL, timeout=30) as r:
    data = r.read()
dt = time.perf_counter() - t0
mbps = (len(data) * 8) / dt / 1e6
print(f"✓ {len(data)/1e6:.1f} MB in {dt:.2f}s  ≈  {mbps:.1f} Mbps")