import secrets, string, subprocess
len_str = input('Length [20]: ').strip() or '20'
n = max(8, min(128, int(len_str)))
alpha = string.ascii_letters + string.digits + '!@#$%^&*()-_=+[]{};:,.?'
pw = ''.join(secrets.choice(alpha) for _ in range(n))
print(pw)
try:
    subprocess.run('clip', input=pw, text=True, check=True)
    print('(copied to clipboard)')
except Exception: pass