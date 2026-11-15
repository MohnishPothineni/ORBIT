"""Local data: crew, latest readings, evidence passages, shared assistant context, voice settings.

Seeded from data/seed.json (synthetic). Saved vitals and voice settings are written to
data/runtime/ so they survive a restart. Nothing leaves this machine.
"""

import json
import re
import threading
import uuid
from datetime import datetime, timezone
from typing import Any

from .config import DATA_DIR, RUNTIME_DIR

VITAL_META: dict[str, dict[str, Any]] = {
    "heart_rate": {"label": "Heart rate", "unit": "bpm", "min": 20, "max": 250},
    "spo2": {"label": "SpO₂", "unit": "%", "min": 50, "max": 100},
    "systolic_bp": {"label": "Systolic BP", "unit": "mmHg", "min": 50, "max": 260},
    "diastolic_bp": {"label": "Diastolic BP", "unit": "mmHg", "min": 20, "max": 160},
    "temperature": {"label": "Temperature", "unit": "°C", "min": 30, "max": 43},
    "respiratory_rate": {"label": "Respiratory rate", "unit": "/min", "min": 4, "max": 60},
}

_WORD = re.compile(r"[a-z0-9]+")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _stem(word: str) -> str:
    """Very small stemmer so 'bones'/'bone' and 'skeletal'/'skeleton' match."""
    return word[:5] if len(word) > 5 else word.rstrip("s")


class Store:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        seed = json.loads((DATA_DIR / "seed.json").read_text(encoding="utf-8"))
        self.crew: list[dict[str, Any]] = seed["crew"]
        self.summaries: dict[str, dict[str, Any]] = seed["summaries"]
        self.evidence: list[dict[str, Any]] = seed["evidence"]
        self.evidence_updated_at = datetime.fromtimestamp(
            (DATA_DIR / "seed.json").stat().st_mtime, timezone.utc
        ).isoformat(timespec="seconds").replace("+00:00", "Z")
        self.shared_context: list[dict[str, Any]] = []
        RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
        self._vitals_log = RUNTIME_DIR / "vitals.jsonl"
        self._replay_saved_vitals()

    # ------------------------------------------------------------------ crew

    def get_crew(self, crew_id: str) -> dict[str, Any] | None:
        return next((c for c in self.crew if c["id"] == crew_id), None)

    def summary(self, crew_id: str) -> dict[str, Any]:
        return self.summaries.get(crew_id) or {"crewId": crew_id, "readings": [], "wellbeing": None}

    def add_vital(self, crew_id: str, kind: str, value: float, recorded_at: str | None) -> dict[str, Any]:
        """Validate and store a reading. Raises ValueError with a readable message."""
        meta = VITAL_META.get(kind)
        if not meta:
            raise ValueError(f"Unknown reading type: {kind}.")
        if not (meta["min"] <= value <= meta["max"]):
            raise ValueError(f"{value} {meta['unit']} is outside {meta['min']}–{meta['max']} {meta['unit']}.")
        saved = {
            "id": f"v-{uuid.uuid4().hex[:10]}",
            "crewId": crew_id,
            "kind": kind,
            "value": value,
            "unit": meta["unit"],
            "recordedAt": recorded_at or now_iso(),
            "source": "assistant",
        }
        with self._lock:
            self._apply_vital(saved)
            with self._vitals_log.open("a", encoding="utf-8") as f:
                f.write(json.dumps(saved) + "\n")
        return saved

    def _apply_vital(self, v: dict[str, Any]) -> None:
        summary = self.summaries.setdefault(v["crewId"], {"crewId": v["crewId"], "readings": [], "wellbeing": None})
        reading = {
            "kind": v["kind"],
            "label": VITAL_META[v["kind"]]["label"],
            "value": v["value"],
            "unit": v["unit"],
            "recordedAt": v["recordedAt"],
            "source": v["source"],
        }
        summary["readings"] = [r for r in summary["readings"] if r["kind"] != v["kind"]] + [reading]

    def _replay_saved_vitals(self) -> None:
        if not self._vitals_log.exists():
            return
        for line in self._vitals_log.read_text(encoding="utf-8").splitlines():
            try:
                v = json.loads(line)
                if v.get("kind") in VITAL_META:
                    self._apply_vital(v)
            except json.JSONDecodeError:
                continue

    # -------------------------------------------------------------- evidence

    def search_evidence(self, query: str, k: int) -> list[dict[str, Any]]:
        """Keyword search over the local passages (no embeddings yet)."""
        terms = {_stem(w) for w in _WORD.findall(query.lower()) if len(w) > 2}
        if not terms:
            return []
        scored = []
        for chunk in self.evidence:
            words = {_stem(w) for w in _WORD.findall(f"{chunk['title']} {chunk['excerpt']}".lower())}
            words |= {_stem(w) for w in chunk.get("keywords", [])}
            hits = len(terms & words)
            if hits:
                scored.append((hits / len(terms), chunk))
        scored.sort(key=lambda s: s[0], reverse=True)
        return [
            {k_: c[k_] for k_ in ("documentId", "chunkId", "title", "excerpt")} | {"score": round(score, 2)}
            for score, c in scored[:k]
        ]

    @property
    def document_count(self) -> int:
        return len({c["documentId"] for c in self.evidence})


store = Store()
