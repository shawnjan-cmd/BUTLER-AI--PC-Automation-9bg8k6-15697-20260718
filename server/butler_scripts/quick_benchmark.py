import time, hashlib, os, tempfile
print('Butler AI Quick Benchmark\n')
# CPU: hash 50MB of data
print('CPU Test (SHA-256 hashing 50MB)...')
data = os.urandom(50_000_000)
t0 = time.time()
for _ in range(3): hashlib.sha256(data).hexdigest()
cpu_time = time.time() - t0
cpu_score = int(150 / cpu_time)
print(f'  Time: {cpu_time:.2f}s  Score: {cpu_score}')
# RAM: allocate and fill 256MB
print('\nRAM Test (256MB alloc+fill)...')
t0 = time.time()
buf = bytearray(256_000_000)
for i in range(0, len(buf), 4096): buf[i] = i % 256
ram_time = time.time() - t0
ram_score = int(50 / ram_time)
print(f'  Time: {ram_time:.2f}s  Score: {ram_score}')
del buf
# Disk: write/read 64MB
print('\nDisk Test (64MB write+read)...')
with tempfile.NamedTemporaryFile(delete=False) as tf: fname = tf.name
data2 = os.urandom(64_000_000)
t0 = time.time()
with open(fname,'wb') as f: f.write(data2)
with open(fname,'rb') as f: _ = f.read()
disk_time = time.time() - t0
disk_score = int(128 / disk_time)
os.unlink(fname)
print(f'  Time: {disk_time:.2f}s  Score: {disk_score}')
print(f'\n=== TOTAL SCORE: {cpu_score + ram_score + disk_score} ===')