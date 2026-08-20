#!/usr/bin/env python3
"""
BUTLER AI — PROPRIETARY ACHIEVEMENTS & GAMERSCORE REGISTRY v1.0
Contains clever, funny, and cinematic achievement definitions for crawlers,
memory vaults, anti-cheat, and automation milestones.
"""

from typing import Dict, List, Any

ACHIEVEMENT_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "ACH_001",
        "title": "Ctrl+Alt+Delusion",
        "category": "Automation",
        "gamerscore": 50,
        "rarity": "Common",
        "description": "Successfully paired your mobile HUD with the host PC server for the first time.",
        "mascot_quip": "Ah, human-machine symbiosis. Try not to break my firewall."
    },
    {
        "id": "ACH_002",
        "title": "Spiders in the Neural Web",
        "category": "Crawler",
        "gamerscore": 100,
        "rarity": "Uncommon",
        "description": "Dispatched your first local research crawler to map developer documentation.",
        "mascot_quip": "Crawling the net so you don't have to open thirty browser tabs."
    },
    {
        "id": "ACH_003",
        "title": "Schrödinger's Backup",
        "category": "Memory",
        "gamerscore": 150,
        "rarity": "Rare",
        "description": "Encrypted and indexed over 10 vector facts into the AES-GCM local memory vault.",
        "mascot_quip": "Your secrets are safe in the matrix. Literally encrypted."
    },
    {
        "id": "ACH_004",
        "title": "Zero Cloud, Zero Tears",
        "category": "Security",
        "gamerscore": 200,
        "rarity": "Epic",
        "description": "Maintained 100% local-first loopback isolation with zero external telemetry beacons.",
        "mascot_quip": "The cloud is just someone else's computer. We prefer our own basement."
    },
    {
        "id": "ACH_005",
        "title": "Bot Smasher 3000",
        "category": "Anti-Cheat",
        "gamerscore": 250,
        "rarity": "Legendary",
        "description": "Successfully flagged and blocked an automated auto-clicker spamming the leaderboard.",
        "mascot_quip": "Nice try, script kiddie. Algorithms always win."
    },
    {
        "id": "ACH_006",
        "title": "Sentient Coffee Machine",
        "category": "Mastery",
        "gamerscore": 250,
        "rarity": "Legendary",
        "description": "Reached Vault Archon status with 1000G total gamerscore across all subsystems.",
        "mascot_quip": "Bow before your digital butler. Or at least refill my RAM."
    }
]

def calculate_total_gamerscore(unlocked_ids: List[str]) -> int:
    return sum(a["gamerscore"] for a in ACHIEVEMENT_CATALOG if a["id"] in unlocked_ids)

if __name__ == "__main__":
    print(f"Total possible gamerscore: {calculate_total_gamerscore([a['id'] for a in ACHIEVEMENT_CATALOG])}G")
    for ach in ACHIEVEMENT_CATALOG:
        print(f"[{ach['gamerscore']}G] {ach['title']} ({ach['rarity']}) — {ach['description']}")
