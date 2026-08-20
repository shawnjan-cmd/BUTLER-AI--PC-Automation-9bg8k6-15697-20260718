# Butler AI: Local Ollama & AI Operations Research Dossier

This document records evidence-based research into local Ollama performance tuning, context window caching, keep-alive optimizations, and privacy safeguards for self-hosted AI automation suites.

---

### Research Findings & Optimization Levers

1. **Model Keep-Alive & KV Cache Persistence**:
   - Setting explicit `keep_alive` parameters (e.g., `-1` or extended minute counts) on Ollama API requests prevents model unloading between conversational turns, eliminating cold-start latency on local GPUs/CPUs [1] [2].
   - Butler's local chat integration leverages non-streaming JSON responses and cached vector contexts to minimize buffer overhead.

2. **Quantization & Hardware Resource Allocation**:
   - Using 4-bit / 8-bit quantized models (such as `qwen2.5-coder:1.5b` or `7b`) optimizes memory footprint, allowing high-speed inference even on legacy consumer hardware without triggering out-of-memory (OOM) errors [3].

3. **Offline Privacy & Zero Telemetry Enforcement**:
   - Local execution via Ollama ensures zero data exfiltration to cloud endpoints. All prompts, cached vector knowledge, and script automation logs remain anchored within the local SQLite database and encrypted storage vault.

---

### References & Sources

- [1] Ollama FAQ & API Keep-Alive: [Ollama Documentation](https://docs.ollama.com/faq)
- [2] Managing Model Persistence and Keep-Alive: [Simplified Guide](https://www.simplified.guide/ollama/keepalive-set)
- [3] Local AI Performance Tuning (Easton Dev): [Easton Dev Blog](https://eastondev.com/blog/en/posts/ai/20260410-ollama-performance-optimization/)
