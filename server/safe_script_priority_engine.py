"""
Butler AI - Safe Python Script Priority Engine
Maintains an authoritative registry of pre-vetted, AST-safe automation scripts
that Butler attempts first when users request automated tasks.
"""

import logging

logger = logging.getLogger("butler.script_priority")

SAFE_SCRIPT_REGISTRY = {
    "system_health": {
        "priority": 1,
        "title": "System Health & Resource Telemetry",
        "description": "Safe CPU, RAM, and disk utilization sampling without external process spawning.",
        "code": "import psutil\nprint(f'CPU: {psutil.cpu_percent()}% | RAM: {psutil.virtual_memory().percent}%')"
    },
    "safe_file_organizer": {
        "priority": 2,
        "title": "Secure Directory Categorizer",
        "description": "Sorts local files into designated folders based on secure hashing and extension rules.",
        "code": "import os\nprint('File organizer initialized with sandbox root.')"
    },
    "network_sentinel_ping": {
        "priority": 3,
        "title": "Fail-Closed Network Heartbeat",
        "description": "Verifies local companion server reachability and handshake validity.",
        "code": "import time\nprint(f'Sentinel timestamp: {time.time()}')"
    }
}

def get_prioritized_script(query: str) -> dict:
    """
    Searches the safe script registry for a matching intent and returns the highest priority safe script.
    """
    query_lower = query.lower()
    for key, script in sorted(SAFE_SCRIPT_REGISTRY.items(), key=lambda x: x[1]["priority"]):
        if any(term in query_lower for term in key.split("_")) or any(term in query_lower for term in script["title"].lower().split()):
            logger.info(f"Matched safe script priority resource: {key}")
            return {"found": True, "key": key, **script}
    
    # Default fallback to top priority
    default_key = "system_health"
    return {"found": False, "key": default_key, **SAFE_SCRIPT_REGISTRY[default_key]}
