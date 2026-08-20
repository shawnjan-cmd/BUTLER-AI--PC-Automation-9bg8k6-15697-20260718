import os
import tempfile

os.environ["BUTLER_PAIRING_CODE"] = "654321"
os.environ["BUTLER_VAULT_PIN"] = "correct-horse-battery-staple"
os.environ["BUTLER_VAULT_STORE"] = os.path.join(tempfile.gettempdir(), "butler-contract-check-vault.enc")

from fastapi.testclient import TestClient
from butler_server import app

client = TestClient(app)

status = client.get("/api/status")
assert status.status_code == 200, status.text
assert status.json()["status"] == "ONLINE", status.text

wrong = client.post("/pair", json={"pairingCode": "000000", "deviceId": "device-12345678", "platform": "android"})
assert wrong.status_code == 401, wrong.text

paired = client.post("/pair", json={"pairingCode": "654321", "deviceId": "device-12345678", "platform": "android"})
assert paired.status_code == 200, paired.text
token = paired.json().get("sessionToken")
assert token and len(token) >= 16, paired.text

reconnected = client.post("/reconnect", json={"deviceId": "device-12345678"})
assert reconnected.status_code == 200, reconnected.text
assert reconnected.json().get("sessionToken") == token, reconnected.text

vault = client.post("/vault/unlock", json={"pin": "correct-horse-battery-staple"})
assert vault.status_code == 200 and vault.json().get("status") == "UNLOCKED", vault.text

verified = client.post("/api/verify", headers={"Authorization": f"Bearer {token}"}, json={"deviceId": "device-12345678"})
assert verified.status_code == 200 and verified.json().get("ok") is True, verified.text

print("companion contract check passed")
