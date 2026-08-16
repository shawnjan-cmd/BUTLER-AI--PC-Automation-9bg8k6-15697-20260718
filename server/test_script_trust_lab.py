from script_trust_lab import IMMUTABLE_RULES, TrustLab

lab = TrustLab()
safe = lab.scan('safe.py', 'from pathlib import Path\nprint(Path.cwd())\n', origin='bundled-library')
assert safe.status == 'verified', safe
assert safe.verified

syntax = lab.scan('broken.py', 'def nope(:\n  pass\n')
assert syntax.status == 'blocked'
assert any(f.rule_id == 'PY_SYNTAX' for f in syntax.findings)

dynamic = lab.scan('dynamic.py', 'eval(input())\n')
assert dynamic.status == 'blocked'
assert any(f.rule_id == 'AST_DYNAMIC' for f in dynamic.findings)

network = lab.scan('download.py', 'import urllib.request\nurllib.request.urlopen("https://example.invalid/a.exe")\n')
assert network.status == 'blocked'
assert any(f.rule_id == 'NET_POLICY' for f in network.findings)

payload = lab.scan('payload.py', 'import base64\n# powershell -enc SGVsbG8=\n')
assert payload.status == 'blocked'
assert any(f.severity == 'block' for f in payload.findings)

origin = lab.scan('unknown.py', 'print(1)\n', origin='internet')
assert origin.status == 'blocked'
assert any(f.rule_id == 'ORIGIN_UNKNOWN' for f in origin.findings)
assert len(IMMUTABLE_RULES) == 3
print('SCRIPT TRUST LAB TESTS PASSED')
