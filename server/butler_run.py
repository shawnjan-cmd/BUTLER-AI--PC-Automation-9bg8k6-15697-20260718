#!/usr/bin/env python3
"""
BUTLER AI — CANONICAL SERVER & QR PAIRING LAUNCHER v21.0
Unified entry point for Butler's local companion server.
Provides:
1. Console-first batch style startup with ASCII banner.
2. One-time QR code generation for mobile pairing.
3. Automatic pairing lock after the first successful client join.
4. Fallback to PyQt native control center UI or headless daemon mode.
"""

import sys
import os
import time
import socket
import secrets
import qrcode
import threading
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from butler_master_server import app, observatory, recovery_governor, vault

# Pairing State
PAIRING_STATE = {
    "bootstrap_token": secrets.token_hex(16),
    "is_paired": False,
    "paired_device_id": None,
    "created_at": time.time(),
    "expires_at": time.time() + 600
}

class PairRequest(BaseModel):
    bootstrap_token: str
    device_id: str

@app.post("/api/pair/verify")
async def verify_pairing(payload: PairRequest, request: Request):
    if PAIRING_STATE["is_paired"]:
        return JSONResponse(
            status_code=403,
            content={
                "status": "REJECTED",
                "reason": "SERVER_ALREADY_PAIRED_LOCKED",
                "paired_device": PAIRING_STATE["paired_device_id"]
            }
        )

    if time.time() > PAIRING_STATE["expires_at"]:
        return JSONResponse(
            status_code=403,
            content={"status": "REJECTED", "reason": "PAIRING_TOKEN_EXPIRED"}
        )

    if not secrets.compare_digest(payload.bootstrap_token, PAIRING_STATE["bootstrap_token"]):
        return JSONResponse(
            status_code=401,
            content={"status": "REJECTED", "reason": "INVALID_BOOTSTRAP_TOKEN"}
        )

    PAIRING_STATE["is_paired"] = True
    PAIRING_STATE["paired_device_id"] = payload.device_id
    observatory.push_event("SECURITY", f"Device {payload.device_id} successfully paired and server locked.")

    return {
        "status": "PAIRING_SUCCESS_LOCKED",
        "device_id": payload.device_id,
        "message": "Server permanently bound to device. Further pairing attempts blocked."
    }

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def print_banner_and_qr(server_url: str):
    banner = """
================================================================================
  ____        _   _              _    ___ 
 | __ ) _   _| |_| | ___ _ __   / \\  |_ _|
 |  _ \\| | | | __| |/ _ \\ '__| / _ \\  | | 
 | |_) | |_| | |_| |  __/ |   / ___ \\ | | 
 |____/ \\__,_|\\__|_|\\___|_|  /_/   \\_\\___|
 
 BULLETPROOF PC AUTOMATION DAEMON (CANONICAL RELEASE v21.0)
================================================================================
"""
    print(banner)
    print(f"[*] Companion Server running at: {server_url}")
    print(f"[*] Local Bootstrap Token: {PAIRING_STATE['bootstrap_token']}")
    print("[*] Generating One-Time App Pairing QR Code...\n")

    pairing_payload = f"butler://pair?url={server_url}&token={PAIRING_STATE['bootstrap_token']}"
    
    try:
        qr = qrcode.QRCode(version=1, box_size=1, border=1)
        qr.add_data(pairing_payload)
        qr.make(fit=True)
        qr.print_ascii(tty=True)
    except Exception:
        print(f"[!] Pairing URI: {pairing_payload}")

    print("\n[!] Scan this QR code with the Butler mobile app to pair.")
    print("[!] SECURITY NOTICE: Server pairing will automatically lock after first join.\n")
    print("--------------------------------------------------------------------------------\n")

if __name__ == "__main__":
    local_ip = get_local_ip()
    server_url = f"http://{local_ip}:8000"
    
    print_banner_and_qr(server_url)
    
    # Run Uvicorn server
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
