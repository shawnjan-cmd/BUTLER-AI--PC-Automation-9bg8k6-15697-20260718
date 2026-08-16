from pathlib import Path
PATH = Path.home() / "Desktop" / "notes.txt"   # ← edit me
text = PATH.read_text(encoding="utf-8")
print(f"Lines : {text.count(chr(10))+1}")
print(f"Words : {len(text.split())}")
print(f"Chars : {len(text)}")