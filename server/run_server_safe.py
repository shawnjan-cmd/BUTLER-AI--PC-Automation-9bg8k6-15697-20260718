"""Conservative Butler server launcher.

Default: loopback-only. Use --lan only on a trusted private network.
This wrapper does not replace server authentication; it adds a safer bind default.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Launch Butler PC server with an explicit network scope")
    parser.add_argument("--lan", action="store_true", help="opt into private-LAN pairing; never use on public networks")
    parser.add_argument("server_args", nargs=argparse.REMAINDER, help="arguments passed to the server after --")
    args = parser.parse_args()

    root = Path(__file__).resolve().parent
    server = root / "butler_server_v20_1_0_OSS.py"
    if not server.is_file():
        raise SystemExit(f"Missing server file: {server}")

    env = os.environ.copy()
    env["BUTLER_BIND"] = env.get("BUTLER_BIND", "0.0.0.0" if args.lan else "127.0.0.1")
    if not args.lan and env["BUTLER_BIND"] not in {"127.0.0.1", "::1"}:
        raise SystemExit("Refusing non-loopback BUTLER_BIND without explicit --lan")

    command = [sys.executable, str(server), *args.server_args]
    return subprocess.call(command, cwd=str(root.parent), env=env, shell=False)


if __name__ == "__main__":
    raise SystemExit(main())
