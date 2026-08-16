import base64
try:
    import pyperclip
except ImportError:
    print('Install: pip install pyperclip'); raise SystemExit
txt=pyperclip.paste() or ''
enc=base64.b64encode(txt.encode()).decode()
pyperclip.copy(enc)
print(f'✓ Encoded {len(txt)} chars -> {len(enc)} chars (now on clipboard)')
print(enc[:200] + ('...' if len(enc)>200 else ''))