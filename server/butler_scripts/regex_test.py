import re
PATTERN=r'\\b\\w+@\\w+\\.\\w+\\b'
TEXT='Contact alice@ex.com or bob@test.org for info.'
m=list(re.finditer(PATTERN, TEXT))
print(f'Pattern : {PATTERN}')
print(f'Text    : {TEXT}')
print(f'Matches : {len(m)}')
for i,x in enumerate(m,1):
    print(f'  [{i}] {x.group()!r}  (groups={x.groups()})')