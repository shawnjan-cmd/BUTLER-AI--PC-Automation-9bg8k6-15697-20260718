#!/usr/bin/env python3
"""
BUTLER AI — CONSOLE SERVER LAUNCHER & ONE-TIME QR PAIRING ENGINE v1.0
Launches in a standard console/batch window, prints startup ASCII banner and status,
generates a one-time pairing QR code in the console, binds the server to local network,
and automatically locks pairing immediately after the first successful client join.
"""

import sys
import os
import time
import socket
import secrets
import qrcode
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
import uvicorn
from pydantic import BaseModel

# Import master server components
from butler_master_server import app, observatory, recovery_governor, vault

# One-time pairing state
PAIRING_STATE = {
    "bootstrap_token": secrets.token_hex(16),
    "is_paired": False,
    "paired_device_id": None,
    "created_at": time.time(),
    "expires_at": time.time() + 300 # 5 minutes expiration
}

class PairRequest(BaseModel):
    bootstrap_token: str
    device_id: str

@app.post("/api/pair/verify")
async def verify_pairing(payload: PairRequest, request: Request):
    """
    Verifies the one-time bootstrap token. On first success, locks the server
    permanently to this device_id and disables further pairing attempts.
    """
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

    # Success: Lock pairing permanently to this device
    PAIRING_STATE["is_paired"] = True
    PAIRING_STATE["paired_device_id"] = payload.device_id
    
    client_ip = request.client.host if request.client else "unknown"
    observatory.push_event("SECURITY", f"Device {payload.device_id} successfully paired and server locked.")

    return {
        "status": "PAIRING_SUCCESS_LOCKED",
        "device_id": payload.device_id,
        "server_signature": secrets.token_hex(32),
        "message": "Butler companion server is now securely bound to your device. Further pairing attempts are blocked."
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

def print_console_banner_and_qr(server_url: str):
    banner = """
================================================================================
  ____        _   _              _    ___ 
 | __ ) _   _| |_| | ___ _ __   / \\  |_ _|
 |  _ \\| | | | __| |/ _ \\ '__| / _ \\  | | 
 | |_) | |_| | |_| |  __/ |   / ___ \\ | | 
 |____/ \\__,_|\\__|_|\\___|_|  /_/   \\_\\___|
 
 BULLETPROOF PC AUTOMATION DAEMON (CONSOLE EDITION v1.5)
================================================================================
"""
    print(banner)
    print(f"[*] Companion Server running at: {server_url}")
    print(f"[*] Local Bootstrap Token: {PAIRING_STATE['bootstrap_token']}")
    print("[*] Generating One-Time App Pairing QR Code...\n")

    pairing_payload = f"butler://pair?url={server_url}&token={PAIRING_STATE['bootstrap_token']}"
    
    qr = qrcode.QRCode(version=1, box_size=1, border=1)
    qr.add_data(pairing_payload)
    qr.make(fit=True)
    
    # Print ASCII QR code in console
    qr.print_ascii(tty=True)
    print("\n[!] Scan this QR code with the Butler mobile app to pair.")
    print("[!] SECURITY NOTICE: Server pairing will automatically lock after the first successful join.\n")
    print("--------------------------------------------------------------------------------\n")

if __name__ == "__main__":
    local_ip = get_local_ip()
    server_url = f"http://{local_ip}:8000"
    
    print_console_banner_and_qr(server_url)
    
    # Run server in console
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
