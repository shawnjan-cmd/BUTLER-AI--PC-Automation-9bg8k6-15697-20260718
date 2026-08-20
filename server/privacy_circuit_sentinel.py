"""
Butler AI - Fail-Closed Network Sentinel
Monitors connection state and triggers hardware-backed lockout upon heartbeat loss.
"""

import time
import logging

logger = logging.getLogger("butler.sentinel")

class PrivacyCircuitSentinel:
    def __init__(self, timeout_threshold_sec: int = 10):
        self.timeout_threshold = timeout_threshold_sec
        self.last_heartbeat = time.time()
        self.is_tripped = False

    def ping(self):
        """Refreshes the heartbeat timestamp."""
        self.last_heartbeat = time.time()
        if self.is_tripped:
            logger.info("Privacy Circuit restored via heartbeat ping.")
            self.is_tripped = False

    def check_circuit(self) -> bool:
        """
        Returns True if circuit is secure, False if tripped (fail-closed).
        """
        elapsed = time.time() - self.last_heartbeat
        if elapsed > self.timeout_threshold:
            if not self.is_tripped:
                logger.warning(f"Privacy Circuit tripped! Heartbeat missed by {elapsed:.1f}s.")
                self.is_tripped = True
            return False
        return True
