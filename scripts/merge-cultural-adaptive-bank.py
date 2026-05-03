#!/usr/bin/env python3
"""Merge part JSON arrays and emit content/questions/cultural-adaptive-v1/bank.json."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PART_DIR = ROOT / "content/questions/cultural-adaptive-v1/parts"
OUT = ROOT / "content/questions/cultural-adaptive-v1/bank.json"


def main() -> None:
    merged: list[dict] = []
    for name in ("part1.json", "part2.json", "part3.json", "part4.json"):
        path = PART_DIR / name
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise SystemExit(f"{path}: expected JSON array")
        merged.extend(data)
    if len(merged) != 200:
        raise SystemExit(f"expected 200 items, got {len(merged)}")
    seen: set[str] = set()
    for row in merged:
        qid = row.get("id")
        if not isinstance(qid, str) or not qid:
            raise SystemExit("each row needs string id")
        if qid in seen:
            raise SystemExit(f"duplicate id: {qid}")
        seen.add(qid)
        for k in ("dimension", "reverse", "tags", "variants"):
            if k not in row:
                raise SystemExit(f"{qid}: missing {k}")
        v = row["variants"]
        if not isinstance(v, dict):
            raise SystemExit(f"{qid}: variants must be object")
        for reg in ("global", "ghana", "west_africa"):
            if reg not in v or not isinstance(v[reg], str) or not v[reg].strip():
                raise SystemExit(f"{qid}: variants.{reg} must be non-empty string")
    OUT.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({len(merged)} items)")


if __name__ == "__main__":
    main()
