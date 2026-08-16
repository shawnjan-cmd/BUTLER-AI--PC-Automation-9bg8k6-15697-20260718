import urllib.parse
try:
    import pyperclip
except ImportError:
    print('Install: pip install pyperclip'); raise SystemExit
txt=pyperclip.paste() or ''
if '%' in txt and urllib.parse.unquote(txt)!=txt:
    out=urllib.parse.unquote(txt); mode='decoded'
else:
    out=urllib.parse.quote(txt, safe=''); mode='encoded'
pyperclip.copy(out)
print(f'✓ URL-{mode}; result on clipboard:')
print(out[:300])