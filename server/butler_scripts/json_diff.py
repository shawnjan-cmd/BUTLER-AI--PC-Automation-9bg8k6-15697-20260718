import json, sys
from pathlib import Path
A=Path('a.json'); B=Path('b.json')
if not (A.exists() and B.exists()):
    print(f'Edit script: need {A} and {B}'); raise SystemExit
a=json.loads(A.read_text()); b=json.loads(B.read_text())
def walk(x,y,p=''):
    if type(x)!=type(y): print(f'TYPE  {p}: {type(x).__name__} vs {type(y).__name__}'); return
    if isinstance(x,dict):
        for k in set(x)|set(y):
            if k not in x: print(f'+B    {p}.{k} = {y[k]!r}')
            elif k not in y: print(f'-A    {p}.{k} = {x[k]!r}')
            else: walk(x[k],y[k],f'{p}.{k}')
    elif x!=y: print(f'DIFF  {p}: {x!r} -> {y!r}')
walk(a,b)
print('done')