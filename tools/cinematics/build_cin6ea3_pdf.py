#!/usr/bin/env python3
"""Build the CIN-6E-A.3 Pilot E fidelity-regate operator PDF."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib.colors import Color, HexColor
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output/pdf/CIN-6E-A.3 Pilot E Fidelity Regate.pdf"
CACHE = ROOT / "tmp/pdfs/cin6ea3-review/cache"
REGATE = ROOT / "tools/cinematics/specs/cin6ea3_pilot_e_regate.json"
VERDICT = ROOT / "tmp/cinematics/cin6ea/dynamic/pilot_e_regate_attempt_1/verdict.json"
IMAGE_GATE = ROOT / "tools/cinematics/specs/cin6ea3_pilot_e_image_gate.json"
PAGE_W, PAGE_H = landscape(A4)
BG = HexColor("#090D14")
PANEL = HexColor("#111925")
LINE = HexColor("#334154")
GOLD = HexColor("#E2BD76")
TEXT = HexColor("#F0EDE5")
MUTED = HexColor("#A9B1BD")
PASS = HexColor("#5ED3A1")
REJECT = HexColor("#FF7777")


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def text(c: canvas.Canvas, value: str, x: float, y: float, width: float, *, size: float = 9,
         color=TEXT, font: str = "Helvetica", leading: float | None = None,
         max_lines: int | None = None) -> float:
    leading = leading or size * 1.3
    words = str(value).split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if not current or stringWidth(candidate, font, size) <= width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    if max_lines and len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = lines[-1].rstrip(" .") + "..."
    c.setFillColor(color)
    c.setFont(font, size)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def title(c: canvas.Canvas, kicker: str, heading: str, subtitle: str = "") -> None:
    c.setFillColor(BG)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(30, PAGE_H - 28, kicker.upper())
    c.setFont("Helvetica-Bold", 21)
    c.drawString(30, PAGE_H - 53, heading)
    if subtitle:
        text(c, subtitle, 30, PAGE_H - 70, PAGE_W - 60, size=8.5, color=MUTED)
    c.setStrokeColor(LINE)
    c.line(30, PAGE_H - 80, PAGE_W - 30, PAGE_H - 80)


def footer(c: canvas.Canvas, page: int) -> None:
    c.setStrokeColor(LINE)
    c.line(30, 22, PAGE_W - 30, 22)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    c.drawString(30, 10, "RPGThreeJS | CIN-6E-A.3 | E-ONLY NON-PRODUCTION REVIEW")
    c.drawRightString(PAGE_W - 30, 10, f"PAGE {page}")


def panel(c: canvas.Canvas, x: float, y: float, width: float, height: float, border=LINE) -> None:
    c.setFillColor(PANEL)
    c.setStrokeColor(border)
    c.roundRect(x, y, width, height, 6, fill=1, stroke=1)


def badge(c: canvas.Canvas, value: str, x: float, y: float, color, width: float) -> None:
    c.setFillColor(Color(color.red, color.green, color.blue, alpha=0.12))
    c.setStrokeColor(color)
    c.roundRect(x, y, width, 20, 5, fill=1, stroke=1)
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(x + width / 2, y + 6, value)


def prepared(path: Path) -> Path:
    digest = hashlib.sha256(path.read_bytes()).hexdigest()[:20]
    target = CACHE / f"{digest}.jpg"
    if target.exists():
        return target
    CACHE.mkdir(parents=True, exist_ok=True)
    with PILImage.open(path) as source:
        image = source.convert("RGBA")
        background = PILImage.new("RGBA", image.size, (9, 13, 20, 255))
        background.alpha_composite(image)
        flattened = background.convert("RGB")
        flattened.thumbnail((1800, 1300), PILImage.Resampling.LANCZOS)
        flattened.save(target, "JPEG", quality=90, optimize=True, progressive=True)
    return target


def image_fit(c: canvas.Canvas, path: Path, x: float, y: float, width: float, height: float) -> None:
    c.setFillColor(PANEL)
    c.rect(x, y, width, height, fill=1, stroke=0)
    source = prepared(path)
    with PILImage.open(source) as image:
        iw, ih = image.size
    scale = min(width / iw, height / ih)
    dw, dh = iw * scale, ih * scale
    c.drawImage(str(source), x + (width - dw) / 2, y + (height - dh) / 2, dw, dh,
                preserveAspectRatio=True, mask="auto")
    c.setStrokeColor(LINE)
    c.rect(x, y, width, height, fill=0, stroke=1)


def build() -> None:
    regate = load_json(REGATE)
    verdict = load_json(VERDICT)
    image_gate = load_json(IMAGE_GATE)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=(PAGE_W, PAGE_H), pageCompression=1)
    c.setTitle("CIN-6E-A.3 Pilot E Fidelity Regate")
    c.setAuthor("RPGThreeJS cinematic QA")

    # Page 1: decision and the approved source/final comparison.
    title(c, "RPGThreeJS", "CIN-6E-A.3 Pilot E Fidelity Regate",
          "Operator-approved E-C source | one MiniMax-H3 continuous-shot attempt | complete E-only dynamic validation")
    badge(c, "PILOT E: AGENT VIDEO PASS", 30, PAGE_H - 116, PASS, 200)
    badge(c, "DYNAMIC VIDEO GATE: YES PENDING OPERATOR", 242, PAGE_H - 116, PASS, 285)
    badge(c, "VISUAL PRODUCTION LOCK: YES PENDING OPERATOR", 539, PAGE_H - 116, PASS, 272)
    image_fit(c, ROOT / regate["source"]["path"], 30, 188, 378, 213)
    image_fit(c, ROOT / regate["h3"]["finalFramePath"], 426, 188, 378, 213)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(30, 174, "OPERATOR-APPROVED E-C SOURCE")
    c.drawString(426, 174, "EXACT FINAL FRAME 119 / 120")
    panel(c, 30, 42, PAGE_W - 60, 108, PASS)
    facts = [
        "1920x1080 | 24 fps | 5.000 s | silent | MiniMax-H3 | one attempt",
        "Cuts 0 | identity breaks 0 | mask breaks 0 | cast additions/disappearances 0",
        "World resets 0 | spatial resets 0 | final frame HOLD SAFE PASS",
        "C and F remain operator-approved and byte-identical. Production media and manifest unchanged.",
    ]
    y = 126
    for fact in facts:
        c.setFillColor(PASS if y > 86 else MUTED)
        c.setFont("Helvetica-Bold" if y > 86 else "Helvetica", 8.5)
        c.drawString(44, y, fact)
        y -= 22
    footer(c, 1)
    c.showPage()

    # Page 2: old failures, corrected source and canonical authority.
    title(c, "Identity source comparison", "E-A / E-B rejection to E-C approval",
          "Canonical Cedric and Kestrel full sprites remain the absolute identity authority.")
    cells = [
        ("E-A REJECTED - Kestrel mask absent", ROOT / image_gate["rejectedSources"]["E-A"]["path"], REJECT),
        ("E-B REJECTED - Cedric mask absent", ROOT / image_gate["rejectedSources"]["E-B"]["path"], REJECT),
        ("E-C OPERATOR APPROVED", ROOT / regate["source"]["path"], PASS),
    ]
    gap = 12
    w = (PAGE_W - 60 - 2 * gap) / 3
    for index, (label, path, color) in enumerate(cells):
        x = 30 + index * (w + gap)
        image_fit(c, path, x, 252, w, 190)
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x, 238, label)
    image_fit(c, ROOT / regate["characterReferences"]["cedric"]["path"], 148, 45, 210, 170)
    image_fit(c, ROOT / regate["characterReferences"]["kestrel"]["path"], 480, 45, 210, 170)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(253, 31, "CANONICAL CEDRIC - CLOSED METAL MASK")
    c.drawCentredString(585, 31, "CANONICAL KESTREL - GREEN CLOTH MASK")
    footer(c, 2)
    c.showPage()

    # Page 3: temporal and mask continuity.
    title(c, "Temporal evidence", "Opening / middle / final and mask continuity",
          "Six representative full-resolution samples, twelve uniform samples and browser playback were reviewed.")
    image_fit(c, ROOT / "tmp/cinematics/cin6ea/dynamic/pilot_e_regate_attempt_1/selected_frames.png",
              30, 250, PAGE_W - 60, 220)
    image_fit(c, ROOT / "tmp/cinematics/cin6ea/review/cin6ea3/pilot-e-mask-continuity.png",
              30, 52, PAGE_W - 60, 175)
    c.setFillColor(PASS)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(30, 236, "INTERNAL CUT COUNT 0 | AUTOMATED CUT CANDIDATES 0 | SAMPLED DISCONTINUITY PAIRS 0")
    c.drawString(30, 38, "CEDRIC MASK PASS | KESTREL MASK PASS THROUGH ALL REVIEWED INTERVALS")
    footer(c, 3)
    c.showPage()

    # Page 4: final frame and all gate values.
    title(c, "Endpoint and gate values", "Exact final frame is HOLD-safe",
          f"Decoded frame {verdict['finalFrame']['decodedFrameIndex']} at {verdict['finalFrame']['timestampSeconds']:.6f}s | SHA-256 {verdict['finalFrame']['sha256']}")
    image_fit(c, ROOT / regate["h3"]["finalFramePath"], 30, 98, 520, 292)
    panel(c, 570, 98, PAGE_W - 600, 292, PASS)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(584, 370, "VIDEO GATES")
    y = 344
    for name, value in regate["gates"].items():
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8)
        c.drawString(584, y, name)
        c.setFillColor(PASS)
        c.setFont("Helvetica-Bold", 8)
        c.drawRightString(PAGE_W - 44, y, str(value))
        y -= 28
    c.setFillColor(PASS)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(30, 76, "FINAL FRAME HOLD SAFE: PASS")
    text(c, "Both masks, both characters, all required weapons, the shared ground plane and the Forest Road environment remain sharp and continuous.",
         30, 59, 520, size=8, color=MUTED, max_lines=2)
    footer(c, 4)
    c.showPage()

    # Page 5: same-game continuity and final status.
    title(c, "Cross-mode continuity", "Updated same-game visual continuity",
          "GOLD frames, static tableaux, Travel Still, approved C/F video frames, rejected E-A evidence and the passing E-C regate frame.")
    image_fit(c, ROOT / "tmp/cinematics/cin6ea/review/global-continuity-board.png",
              30, 60, PAGE_W - 60, PAGE_H - 155)
    c.setFillColor(PASS)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(30, 42, "AGENT VISUAL QA: PASS | HUMAN VISUAL REVIEW: REQUIRED | READY FOR CIN-6E-B: PENDING HUMAN VISUAL APPROVAL")
    footer(c, 5)
    c.showPage()

    c.save()
    print(json.dumps({"pdf": OUTPUT.relative_to(ROOT).as_posix(), "pages": 5, "status": "CREATED"}, indent=2))


if __name__ == "__main__":
    build()
