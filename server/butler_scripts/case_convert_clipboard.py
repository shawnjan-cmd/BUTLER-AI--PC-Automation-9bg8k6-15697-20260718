import re
try:
    import pyperclip
except ImportError:
    print('Install: pip install pyperclip'); raise SystemExit
txt=pyperclip.paste() or ''
if txt.islower(): out=txt.upper(); mode='UPPER'
elif txt.isupper(): out=txt.title(); mode='Title'
elif txt.istitle(): out=re.sub(r'\\s+','_', txt.lower()); mode='snake_case'
else: out=txt.lower(); mode='lower'
pyperclip.copy(out)
print(f'✓ {mode}:\n{out[:300]}')