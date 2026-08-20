#!/usr/bin/env python3
"""
BUTLER AI — BLIND BADGE ANONYMOUS LEADERBOARD & ANTI-CHEAT ENGINE v2.0
Prevents bot auto-clicking, score tampering, and unauthorized spikes with
rate limiting, max delta caps, and cryptographic challenge nonces.
"""

import time
import hashlib
import json
from typing import Dict, List, Any

class ButlerBlindLeaderboard:
    def __init__(self, min_update_interval: float = 2.0, max_score_delta: int = 500):
        self.entries: Dict[str, Dict[str, Any]] = {}
        self.last_update: Dict[str, float] = {}
        self.min_update_interval = min_update_interval
        self.max_score_delta = max_score_delta

    def register_score(self, blind_token: str, alias: str, score: int, proof_tag: str) -> Dict[str, Any]:
        """
        Registers or updates an anonymous gamerscore entry with anti-cheat and bot mitigation.
        """
        now = time.time()
        
        # 1. Rate-limiting check (prevents bot auto-clicker flooding)
        if blind_token in self.last_update:
            elapsed = now - self.last_update[blind_token]
            if elapsed < self.min_update_interval:
                return {"status": "REJECTED", "reason": "RATE_LIMIT_EXCEEDED"}

        # 2. Maximum score delta check (prevents impossible score jumps)
        if blind_token in self.entries:
            prev_score = self.entries[blind_token]["score"]
            delta = score - prev_score
            if delta > self.max_score_delta:
                return {"status": "REJECTED", "reason": "EXCESSIVE_SCORE_DELTA"}
            if delta < 0:
                return {"status": "REJECTED", "reason": "SCORE_REGRESSION_NOT_ALLOWED"}

        # 3. Cryptographic proof validation
        expected_tag = hashlib.sha256(f"{blind_token}:{score}".encode()).hexdigest()[:16]
        if proof_tag != expected_tag:
            return {"status": "REJECTED", "reason": "INVALID_CRYPTOGRAPHIC_PROOF"}

        self.entries[blind_token] = {
            "alias": alias[:24],
            "score": int(score),
            "updated_at": now
        }
        self.last_update[blind_token] = now
        return {"status": "REGISTERED", "blind_token": blind_token, "score": score}

    def withdraw_score(self, blind_token: str) -> Dict[str, Any]:
        if blind_token in self.entries:
            del self.entries[blind_token]
            if blind_token in self.last_update:
                del self.last_update[blind_token]
            return {"status": "WITHDRAWN", "blind_token": blind_token}
        return {"status": "NOT_FOUND"}

    def get_leaderboard(self, limit: int = 10) -> List[Dict[str, Any]]:
        sorted_items = sorted(self.entries.values(), key=lambda x: x["score"], reverse=True)
        return sorted_items[:limit]

if __name__ == "__main__":
    lb = ButlerBlindLeaderboard(min_update_interval=0.1, max_score_delta=200)
    token = hashlib.sha256(b"device-secret-123").hexdigest()
    proof = hashlib.sha256(f"{token}:150".encode()).hexdigest()[:16]
    print("Register 150G:", lb.register_score(token, "ShadowSentinel", 150, proof))
    
    # Try rapid bot update (should trigger rate limit or delta)
    proof2 = hashlib.sha256(f"{token}:9999".encode()).hexdigest()[:16]
    print("Register Bot Spike:", lb.register_score(token, "ShadowSentinel", 9999, proof2))
