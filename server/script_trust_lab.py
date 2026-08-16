"""Butler Script Trust Lab.

Defensive, offline-first policy engine. This module never executes scanned source;
it produces evidence and a fail-closed rehearsal plan for a separately supervised
runner. The caller must still require explicit user confirmation before execution.
"""
from __future__ import annotations

import ast
import hashlib
import json
import re
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Iterable, Optional

MAX_SOURCE_BYTES = 64 * 1024
MAX_REHEARSAL_SECONDS = 30
MAX_OUTPUT_BYTES = 64 * 1024

IMMUTABLE_RULES = (
    "NEVER_EXECUTE_UNTRUSTED_SOURCE",
    "NEVER_DOWNLOAD_OR_INSTALL_WITHOUT_EXPLICIT_CONFIRMATION",
    "NEVER_EXFILTRATE_SECRETS_OR_PRIVATE_DATA",
)

# These are intentionally conservative indicators, not claims of complete malware detection.
BLOCKED_CALLS = {
    "eval": "dynamic code evaluation",
    "exec": "dynamic code execution",
    "compile": "runtime code compilation",
    "__import__": "dynamic import",
    "os.system": "shell command execution",
    "subprocess.Popen": "unbounded child process",
    "subprocess.call": "child process execution",
    "subprocess.check_call": "child process execution",
    "subprocess.check_output": "child process execution",
    "requests.get": "network retrieval",
    "requests.post": "network transmission",
    "urllib.request.urlopen": "network retrieval",
    "shutil.rmtree": "recursive deletion",
}

SUSPICIOUS_TEXT = (
    (r"shell\s*=\s*True", "shell=True can enable shell interpretation"),
    (r"powershell\s+.*-enc(?:odedcommand)?", "encoded PowerShell command"),
    (r"(?:certutil|bitsadmin|mshta|rundll32|regsvr32)\s+", "living-off-the-land launcher"),
    (r"(?:startup|autorun|run\s*keys|scheduled\s*task)", "persistence mechanism reference"),
    (r"(?:mimikatz|keylog|stealer|ransom|cryptominer)", "credential theft, ransomware, or mining indicator"),
    (r"(?:base64|b64decode)\s*\([^\n]{0,400}\)", "encoded payload construction"),
    (r"(?:\.exe|\.dll|\.msi|\.scr|\.bat|\.cmd|\.ps1)\b", "executable or command payload reference"),
)

@dataclass(frozen=True)
class Finding:
    rule_id: str
    severity: str
    message: str
    line: Optional[int] = None
    evidence: str = ""

@dataclass(frozen=True)
class TrustReport:
    script_id: str
    sha256: str
    status: str
    syntax_ok: bool
    source_bytes: int
    findings: tuple[Finding, ...] = field(default_factory=tuple)
    immutable_rules: tuple[str, ...] = IMMUTABLE_RULES
    rehearsal: dict[str, object] = field(default_factory=dict)
    generated_at: float = field(default_factory=time.time)

    @property
    def verified(self) -> bool:
        return self.status == "verified" and self.syntax_ok and not any(f.severity == "block" for f in self.findings)

    def to_json(self) -> str:
        return json.dumps(asdict(self), sort_keys=True, indent=2)

class TrustLab:
    """Pure scanner and evidence builder. It has no network, shell, or filesystem side effects."""

    def __init__(self, max_source_bytes: int = MAX_SOURCE_BYTES) -> None:
        self.max_source_bytes = max_source_bytes

    def scan(self, script_id: str, source: str, *, origin: str = "local", allow_network: bool = False) -> TrustReport:
        raw = source.encode("utf-8", "replace")
        digest = hashlib.sha256(raw).hexdigest()
        findings: list[Finding] = []
        if len(raw) > self.max_source_bytes:
            findings.append(Finding("SRC_SIZE", "block", f"Source exceeds {self.max_source_bytes} bytes"))
        if origin not in {"local", "paired-server", "bundled-library"}:
            findings.append(Finding("ORIGIN_UNKNOWN", "block", "Script origin is not allowlisted", evidence=origin[:120]))
        try:
            tree = ast.parse(source, filename=script_id, mode="exec")
            syntax_ok = True
        except SyntaxError as exc:
            syntax_ok = False
            findings.append(Finding("PY_SYNTAX", "block", "Python syntax validation failed", exc.lineno, str(exc)))
            tree = None
        if tree is not None:
            findings.extend(self._ast_findings(tree, allow_network=allow_network))
        findings.extend(self._text_findings(source))
        if not allow_network and any(f.rule_id.startswith("NET_") for f in findings):
            findings.append(Finding("NET_POLICY", "block", "Network access is disabled by the offline trust policy"))
        status = "blocked" if any(f.severity == "block" for f in findings) else ("review" if findings else "verified")
        rehearsal = {
            "mode": "static-only-fail-closed",
            "would_execute": False,
            "timeout_seconds": MAX_REHEARSAL_SECONDS,
            "max_output_bytes": MAX_OUTPUT_BYTES,
            "network": "disabled" if not allow_network else "explicit-review-required",
            "filesystem": "isolated-workspace-required",
        }
        return TrustReport(script_id, digest, status, syntax_ok, len(raw), tuple(findings), rehearsal=rehearsal)

    def _ast_findings(self, tree: ast.AST, *, allow_network: bool) -> Iterable[Finding]:
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                name = self._call_name(node.func)
                if name in {"eval", "exec", "compile", "__import__"}:
                    yield Finding("AST_DYNAMIC", "block", f"Blocked {BLOCKED_CALLS[name]}", getattr(node, "lineno", None), name)
                elif name in BLOCKED_CALLS:
                    rule = "NET_RETRIEVAL" if name.startswith(("requests.", "urllib.")) else "PROCESS_OR_DELETE"
                    severity = "review" if rule == "NET_RETRIEVAL" and allow_network else "block"
                    yield Finding(rule, severity, BLOCKED_CALLS[name], getattr(node, "lineno", None), name)
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                module = getattr(node, "module", "") or ""
                names = [a.name for a in getattr(node, "names", [])]
                joined = ".".join([module, *names])
                if any(x in joined for x in ("ctypes", "winreg", "socket", "paramiko")):
                    yield Finding("PRIVILEGED_OR_NETWORK_IMPORT", "review", "Privileged, registry, or direct network import requires review", getattr(node, "lineno", None), joined)

    def _text_findings(self, source: str) -> Iterable[Finding]:
        for line_no, line in enumerate(source.splitlines(), 1):
            for pattern, message in SUSPICIOUS_TEXT:
                if re.search(pattern, line, re.IGNORECASE):
                    severity = "block" if any(term in message for term in ("payload", "launcher", "persistence", "ransomware", "credential", "encoded PowerShell")) else "review"
                    yield Finding("TEXT_INDICATOR", severity, message, line_no, line.strip()[:240])

    @staticmethod
    def _call_name(node: ast.AST) -> str:
        if isinstance(node, ast.Name):
            return node.id
        if isinstance(node, ast.Attribute):
            parent = TrustLab._call_name(node.value)
            return f"{parent}.{node.attr}" if parent else node.attr
        return ""

def scan_file(path: str | Path, *, origin: str = "local") -> TrustReport:
    p = Path(path)
    source = p.read_text(encoding="utf-8", errors="replace")
    return TrustLab().scan(p.name, source, origin=origin)

__all__ = ["TrustLab", "TrustReport", "Finding", "IMMUTABLE_RULES", "scan_file"]
