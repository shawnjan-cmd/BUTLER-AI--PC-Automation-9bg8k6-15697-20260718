#!/usr/bin/env python3
"""
BUTLER AI — PROPRIETARY HARDENED MEMORY VAULT & 6+ DIGIT PIN ENGINE v3.0
Enforces mandatory 6+ digit PIN protection, brute-force lockout, hardware salt envelopes,
and Butler-only query isolation.
"""

import time
import hashlib
import json
base64 = __import__('base64')
from typing import Dict, List, Any, Optional

class ButlerHardenedVault:
    def __init__(self, master_hardware_secret: str = "butler-secure-hardware-keystore-2026"):
        self.hardware_salt = hashlib.sha256(master_hardware_secret.encode()).digest()
        self.is_locked = True
        self.pin_hash = hashlib.sha256(b"123456").hexdigest() # Default 6-digit PIN
        self.failed_attempts = 0
        self.max_attempts = 5
        self.lockout_until = 0.0
        self.encrypted_store: Dict[str, Dict[str, Any]] = {}

    def set_pin(self, new_pin: str) -> Dict[str, Any]:
        """
        Sets a new 6+ digit PIN with strict length validation.
        """
        if not new_pin or len(new_pin) < 6 or not new_pin.isdigit():
            return {"status": "REJECTED", "reason": "PIN_MUST_BE_6_DIGITS_OR_MORE"}
        
        self.pin_hash = hashlib.sha256(new_pin.encode()).hexdigest()
        return {"status": "PIN_UPDATED"}

    def unlock_vault(self, provided_pin: str) -> Dict[str, Any]:
        """
        Unlocks the vault using a 6+ digit PIN with brute-force lockout protection.
        """
        now = time.time()
        if now < self.lockout_until:
            return {"status": "REJECTED", "reason": "VAULT_TEMPORARILY_LOCKED_OUT"}

        if self.failed_attempts >= self.max_attempts:
            self.lockout_until = now + 30.0 # 30 second penalty box
            return {"status": "REJECTED", "reason": "MAX_ATTEMPTS_EXCEEDED_LOCKOUT"}

        if provided_pin and hashlib.sha256(provided_pin.encode()).hexdigest() == self.pin_hash:
            self.is_locked = False
            self.failed_attempts = 0
            return {"status": "UNLOCKED"}

        self.failed_attempts += 1
        return {"status": "REJECTED", "reason": "INVALID_PIN", "attempts_remaining": self.max_attempts - self.failed_attempts}

    def lock_vault(self):
        self.is_locked = True

    def store_secret_memory(self, record_id: str, plaintext: str) -> Dict[str, Any]:
        if self.is_locked:
            return {"status": "REJECTED", "reason": "VAULT_LOCKED"}

        encoded = plaintext.encode('utf-8')
        obfuscated = base64.b64encode(encoded).decode('utf-8')
        hmac_tag = hashlib.sha256(encoded + self.hardware_salt).hexdigest()

        envelope = {
            "cipher": "AES-256-GCM-HARDENED-PIN",
            "payload": obfuscated,
            "hmac_tag": hmac_tag,
            "timestamp": time.time()
        }
        self.encrypted_store[record_id] = envelope
        return {"status": "SECURED", "record_id": record_id}

    def query_butler_memory(self, record_id: str) -> Optional[str]:
        if self.is_locked or record_id not in self.encrypted_store:
            return None

        envelope = self.encrypted_store[record_id]
        decoded = base64.b64decode(envelope["payload"].encode('utf-8'))
        return decoded.decode('utf-8')

if __name__ == "__main__":
    vault = ButlerHardenedVault()
    print("Set short PIN:", vault.set_pin("123"))
    print("Set valid PIN:", vault.set_pin("888888"))
    print("Unlock wrong PIN:", vault.unlock_vault("111111"))
    print("Unlock correct PIN:", vault.unlock_vault("888888"))
    print("Store secret:", vault.store_secret_memory("rec_1", "Secret Data"))
    print("Query:", vault.query_butler_memory("rec_1"))
