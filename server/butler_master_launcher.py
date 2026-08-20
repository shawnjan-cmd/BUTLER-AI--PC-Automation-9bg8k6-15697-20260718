#!/usr/bin/env python3
"""
BUTLER AI — MASTER LAUNCHER v1.0
Spawns the FastAPI Companion Server in a background thread and immediately opens
the Native PyQt Desktop Control Center UI (no browser required).
"""

import sys
import time
import threading
import uvicorn
from butler_master_server import app
from butler_native_desktop_ui import ButlerDesktopUI
from PyQt5.QtWidgets import QApplication

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="error")

if __name__ == "__main__":
    print("[Butler AI] Starting Master Companion Server daemon...")
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # Wait 1 second for server to bind port
    time.sleep(1.0)
    print("[Butler AI] Launching Native Desktop Control Center UI...")

    qt_app = QApplication(sys.argv)
    window = ButlerDesktopUI(server_url="http://127.0.0.1:8000")
    window.show()
    sys.exit(qt_app.exec_())
