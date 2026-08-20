#!/usr/bin/env python3
"""
BUTLER AI — PUBLIC LEADERBOARD CHAT ROOM ENGINE v1.0
Provides optional, privacy-separated public chat for leaderboard participants.
Enforces anonymous display handles, gamerscore badges, rate limits, and abuse moderation.
"""

import time
import hashlib
from typing import Dict, List, Any

class ButlerLeaderboardChatRoom:
    def __init__(self, rate_limit_seconds: float = 1.5, max_message_length: int = 256):
        self.messages: List[Dict[str, Any]] = []
        self.last_posted: Dict[str, float] = {}
        self.blocked_tokens: set = set()
        self.rate_limit_seconds = rate_limit_seconds
        self.max_message_length = max_message_length

    def post_message(self, blind_token: str, anonymous_handle: str, gamerscore: int, text: str) -> Dict[str, Any]:
        """
        Posts an anonymous chat message with achievement badge and moderation checks.
        """
        if blind_token in self.blocked_tokens:
            return {"status": "REJECTED", "reason": "TOKEN_BLOCKED"}

        now = time.time()
        if blind_token in self.last_posted:
            elapsed = now - self.last_posted[blind_token]
            if elapsed < self.rate_limit_seconds:
                return {"status": "REJECTED", "reason": "RATE_LIMIT_EXCEEDED"}

        clean_text = text.strip()
        if not clean_text or len(clean_text) > self.max_message_length:
            return {"status": "REJECTED", "reason": "INVALID_MESSAGE_LENGTH"}

        msg_id = hashlib.sha256(f"{blind_token}:{now}:{clean_text}".encode()).hexdigest()[:16]
        message_entry = {
            "msg_id": msg_id,
            "handle": anonymous_handle,
            "gamerscore": int(gamerscore),
            "text": clean_text,
            "timestamp": now
        }

        self.messages.append(message_entry)
        self.last_posted[blind_token] = now

        # Keep rolling window of last 100 messages
        if len(self.messages) > 100:
            self.messages.pop(0)

        return {"status": "POSTED", "msg_id": msg_id}

    def get_messages(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.messages[-limit:]

if __name__ == "__main__":
    chat = ButlerLeaderboardChatRoom(rate_limit_seconds=0.1)
    res = chat.post_message("token_1", "CyberGhost_482", 850, "Hello fellow Butler automation runners!")
    print("Post:", res)
    print("Messages:", chat.get_messages())
