import os
for k in sorted(os.environ):
    v = os.environ[k]
    if len(v) > 80: v = v[:77] + "..."
    print(f"{k:25} = {v}")