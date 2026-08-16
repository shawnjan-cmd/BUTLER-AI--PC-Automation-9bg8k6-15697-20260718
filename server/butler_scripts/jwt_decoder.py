import base64, json, subprocess
try:
    import pyperclip
    token = pyperclip.paste().strip()
except:
    token = ''
if not token or '.' not in token:
    token = input('Paste JWT token: ').strip()
parts = token.split('.')
if len(parts) != 3:
    print('Invalid JWT (need 3 parts)'); raise SystemExit
def b64d(s):
    s += '=' * (-len(s) % 4)
    return json.loads(base64.urlsafe_b64decode(s))
print('=== HEADER ==='); print(json.dumps(b64d(parts[0]), indent=2))
print('\n=== PAYLOAD ==='); print(json.dumps(b64d(parts[1]), indent=2))
print(f'\n=== SIGNATURE ===\n{parts[2]}')
import time
payload = b64d(parts[1])
if 'exp' in payload:
    exp = payload['exp']
    left = exp - time.time()
    if left < 0: print(f'\n⚠ Token EXPIRED {abs(left/3600):.1f} hours ago!')
    else: print(f'\n✓ Token expires in {left/3600:.1f} hours')