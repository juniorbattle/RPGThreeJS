#!/usr/bin/env python3
"""Generate one locked Option C candidate with auditable Image API provenance."""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
import time
from typing import Any

from openai import OpenAI
from PIL import Image


LOCKED_MODEL = "gpt-image-2.5-sunburst-2026-09-08"
LOCKED_QUALITY = "max"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def load_api_key(env_path: Path) -> str:
    existing = os.environ.get("OPENAI_API_KEY")
    if existing:
        return existing
    if not env_path.is_file():
        raise RuntimeError(f"Environment file not found: {env_path}")
    for raw_line in env_path.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key.strip() == "OPENAI_API_KEY":
            value = value.strip().strip('"').strip("'")
            if value:
                return value
    raise RuntimeError(f"OPENAI_API_KEY is missing or empty in {env_path}")


def safe_dump(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, (list, tuple)):
        return [safe_dump(item) for item in value]
    if isinstance(value, dict):
        return {str(key): safe_dump(item) for key, item in value.items()}
    if hasattr(value, "model_dump"):
        return safe_dump(value.model_dump(exclude={"b64_json"}))
    return str(value)


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("generate", "edit"), required=True)
    parser.add_argument("--candidate-id", required=True)
    parser.add_argument("--prompt-file", type=Path, required=True)
    parser.add_argument("--image", type=Path, action="append", default=[])
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--provenance", type=Path, required=True)
    parser.add_argument("--env-file", type=Path, default=Path(".env.local"))
    parser.add_argument("--model", default=LOCKED_MODEL)
    parser.add_argument("--quality", default=LOCKED_QUALITY)
    parser.add_argument("--size", default="2048x2048")
    parser.add_argument("--background", choices=("transparent", "opaque"), default="transparent")
    parser.add_argument("--parent-candidate")
    args = parser.parse_args()

    if args.model != LOCKED_MODEL:
        raise RuntimeError(f"Refusing non-authoritative model: {args.model}")
    if args.quality != LOCKED_QUALITY:
        raise RuntimeError(f"Refusing non-authoritative quality: {args.quality}")
    if args.mode == "edit" and not args.image:
        raise RuntimeError("Edit mode requires at least one --image")
    if args.mode == "generate" and args.image:
        raise RuntimeError("Generate mode does not accept --image")
    if not args.prompt_file.is_file():
        raise RuntimeError(f"Prompt file not found: {args.prompt_file}")
    for image_path in args.image:
        if not image_path.is_file():
            raise RuntimeError(f"Input image not found: {image_path}")
    if args.out.exists():
        raise RuntimeError(f"Refusing to overwrite existing output: {args.out}")

    prompt = args.prompt_file.read_text(encoding="utf-8").strip()
    started_at = utc_now()
    started = time.perf_counter()
    provenance: dict[str, Any] = {
        "schemaVersion": 1,
        "candidateId": args.candidate_id,
        "parentCandidate": args.parent_candidate,
        "timestampStarted": started_at,
        "mode": args.mode,
        "request": {
            "endpoint": "/v1/images/edits" if args.mode == "edit" else "/v1/images/generations",
            "model": args.model,
            "quality": args.quality,
            "size": args.size,
            "background": args.background,
            "output_format": "png",
            "n": 1,
            "prompt": prompt,
            "promptSha256": hashlib.sha256(prompt.encode("utf-8")).hexdigest(),
            "sourceImages": [
                {
                    "path": image_path.as_posix(),
                    "sha256": sha256(image_path),
                    "bytes": image_path.stat().st_size,
                }
                for image_path in args.image
            ],
        },
    }

    handles = []
    try:
        client = OpenAI(api_key=load_api_key(args.env_file))
        request: dict[str, Any] = {
            "model": args.model,
            "prompt": prompt,
            "quality": args.quality,
            "size": args.size,
            "background": args.background,
            "output_format": "png",
            "n": 1,
        }
        if args.mode == "edit":
            handles = [image_path.open("rb") for image_path in args.image]
            request["image"] = handles if len(handles) > 1 else handles[0]
            raw_response = client.images.with_raw_response.edit(**request)
        else:
            raw_response = client.images.with_raw_response.generate(**request)
        response = raw_response.parse()
        if len(response.data) != 1 or not response.data[0].b64_json:
            raise RuntimeError(f"Expected one base64 image, received {len(response.data)}")
        image_bytes = base64.b64decode(response.data[0].b64_json)
        with Image.open(BytesIO(image_bytes)) as generated:
            raw_dimensions = [generated.width, generated.height]
            raw_mode = generated.mode
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_bytes(image_bytes)
        provenance["response"] = {
            "requestId": raw_response.headers.get("x-request-id"),
            "processingMs": raw_response.headers.get("openai-processing-ms"),
            "date": raw_response.headers.get("date"),
            "modelReported": getattr(response, "model", None),
            "created": getattr(response, "created", None),
            "usage": safe_dump(getattr(response, "usage", None)),
            "outputFormat": getattr(response, "output_format", None),
            "quality": getattr(response, "quality", None),
            "size": getattr(response, "size", None),
        }
        provenance["output"] = {
            "path": args.out.as_posix(),
            "sha256": sha256(args.out),
            "bytes": args.out.stat().st_size,
            "rawDimensions": raw_dimensions,
            "mode": raw_mode,
            "normalizedDimensions": None,
        }
        provenance["status"] = "SUCCEEDED"
    except Exception as exc:
        provenance["status"] = "FAILED"
        provenance["error"] = {
            "type": type(exc).__name__,
            "message": str(exc),
            "statusCode": getattr(exc, "status_code", None),
            "requestId": getattr(exc, "request_id", None),
            "code": getattr(exc, "code", None),
        }
        raise
    finally:
        for handle in handles:
            handle.close()
        provenance["timestampCompleted"] = utc_now()
        provenance["elapsedSeconds"] = round(time.perf_counter() - started, 3)
        write_json(args.provenance, provenance)

    print(json.dumps({
        "candidateId": args.candidate_id,
        "status": provenance["status"],
        "output": provenance.get("output"),
        "requestId": provenance.get("response", {}).get("requestId"),
        "modelRequested": args.model,
        "qualityRequested": args.quality,
        "modelReported": provenance.get("response", {}).get("modelReported"),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
