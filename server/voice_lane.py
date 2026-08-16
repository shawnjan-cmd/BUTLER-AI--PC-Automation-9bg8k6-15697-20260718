"""PC-local voice lane policy for Butler.

This module intentionally defines routing and budgets, not a hidden cloud
speech service. Concrete STT/TTS adapters must be local, declared, and tested.
"""
from __future__ import annotations
from dataclasses import dataclass
from enum import Enum

class VoiceState(str, Enum):
    OFF = "off"
    READY = "ready"
    TRANSCRIBING = "transcribing"
    THINKING = "thinking"
    SPEAKING = "speaking"
    CANCELLED = "cancelled"
    FALLBACK_TEXT = "fallback_text"
    ERROR = "error"

@dataclass(frozen=True)
class VoiceBudget:
    max_audio_bytes: int
    max_audio_seconds: int
    max_response_chars: int
    cpu_percent_ceiling: float
    ram_percent_ceiling: float

LOW_SPEC = VoiceBudget(256 * 1024, 30, 4_000, 75.0, 80.0)
BALANCED = VoiceBudget(512 * 1024, 60, 8_000, 85.0, 88.0)

@dataclass(frozen=True)
class VoiceRoute:
    stt: str
    ollama_model: str
    tts: str
    budget: VoiceBudget
    reason: str


def choose_route(*, cpu_percent: float, ram_percent: float, available_models: list[str]) -> VoiceRoute | None:
    if cpu_percent >= 90 or ram_percent >= 92:
        return None
    budget = LOW_SPEC if cpu_percent >= 70 or ram_percent >= 75 else BALANCED
    model = available_models[0] if available_models else ""
    if not model:
        return None
    return VoiceRoute(
        stt="local-stt-small",
        ollama_model=model,
        tts="local-tts-small",
        budget=budget,
        reason="low_spec_adaptive" if budget is LOW_SPEC else "balanced_local_route",
    )


def accept_audio_chunk(data: bytes, budget: VoiceBudget, elapsed_seconds: int) -> bool:
    return len(data) <= budget.max_audio_bytes and elapsed_seconds <= budget.max_audio_seconds


def truncate_response(text: str, budget: VoiceBudget) -> str:
    return str(text or "")[: budget.max_response_chars]
