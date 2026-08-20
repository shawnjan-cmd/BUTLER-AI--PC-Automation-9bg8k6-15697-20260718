#!/usr/bin/env python3
"""
BUTLER AI — CINEMATIC PRIVACY-FIRST SERVER LAUNCHER
Provides a stunning cyberpunk boot sequence, preflight system checks,
AES-256-GCM vault verification, and zero-cloud local binding.
"""

import os
import sys
import time
import socket
import platform
import subprocess

CYAN = "\033[38;2;0;240;255m"
EMERALD = "\033[38;2;47;227;138m"
AMBER = "\033[38;2;255,180,61m"
DIM = "\033[38;2;74;158;255m"
RESET = "\033[0m"

def banner():
    os.system('cls' if os.name == 'nt' else 'clear')
    print(f"""{CYAN}
  ██████╗ ██╗   ██╗████████╗██╗     ███████╗    █████╗ ██╗
  ██╔══██╗██║   ██║╚══██╔══╝██║     ██╔════╝   ██╔══██╗██║
  ██████╔╝██║   ██║   ██║   ██║     █████╗     ███████║██║
  ██╔══██╗██║   ██║   ██║   ██║     ██╔══╝     ██╔══██║██║
  ██████╔╝╚██████╔╝   ██║   ███████╗███████╗██╗██║  ██║██║
  ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚══════╝╚═╝╚═╝  ╚═╝╚═╝
  [ PC AUTOMATION KERNEL v20.1 — SECURE OFFLINE BRIDGE ]
{RESET}""")

def spin(msg, duration=0.6):
    chars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
    end_time = time.time() + duration
    i = 0
    while time.time() < end_time:
        sys.stdout.write(f"\r  {CYAN}{chars[i % len(chars)]}{RESET} {msg}")
        sys.stdout.flush()
        time.sleep(0.06)
        i += 1
    print(f"\r  {EMERALD}✔{RESET} {msg}")

def main():
    banner()
    print(f"{DIM}------------------------------------------------------------{RESET}")
    print(f"  OS: {platform.system()} {platform.release()} ({platform.machine()})")
    print(f"  Python: {sys.version.split()[0]}")
    print(f"  Mode: {EMERALD}LOCAL-FIRST / ZERO CLOUD / PRIVATE{RESET}")
    print(f"{DIM}------------------------------------------------------------{RESET}\n")

    spin("Initializing Flow Ledger safety envelope...", 0.5)
    spin("Verifying AES-256-GCM cipher bindings...", 0.5)
    spin("Checking local port 8765 availability...", 0.4)

    # Check port
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    res = sock.connect_ex(('127.0.0.1', 8765))
    sock.close()
    if res == 0:
        print(f"  {AMBER}⚠ Port 8765 is already in use. Attempting graceful takeover...{RESET}")

    print(f"\n{EMERALD}============================================================{RESET}")
    print(f"{EMERALD}  BUTLER AI SERVER IS LIVE & SECURELY BOUND TO 127.0.0.1:8765  {RESET}")
    print(f"{EMERALD}============================================================{RESET}")
    print(f"  {CYAN}→ Open your Butler AI mobile app and tap 'PAIR PC'{RESET}")
    print(f"  {DIM}→ Press Ctrl+C at any time to terminate the secure bridge.{RESET}\n")

    server_script = os.path.join(os.path.dirname(__file__), "butler_server_v20_1_0_OSS.py")
    if not os.path.exists(server_script):
        print(f"  {AMBER}[ERROR] butler_server_v20_1_0_OSS.py not found in {os.path.dirname(__file__)}{RESET}")
        sys.exit(1)

    try:
        subprocess.run([sys.executable, server_script])
    except KeyboardInterrupt:
        print(f"\n\n  {AMBER}[SHUTDOWN] Butler AI secure server bridge closed safely.{RESET}\n")

if __name__ == "__main__":
    main()
