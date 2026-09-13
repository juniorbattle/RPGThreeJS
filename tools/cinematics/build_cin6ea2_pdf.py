#!/usr/bin/env python3
"""Build the CIN-6E-A.2 operator video-fidelity PDF from local QA evidence."""

from __future__ import annotations

import json
import hashlib
from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output/pdf/CIN-6E-A.2 Continuous Video Fidelity Gate.pdf"
CACHE = ROOT / "tmp/pdfs/cin6ea2-review/cache"
SELECTIONS = ROOT / "tools/cinematics/specs/cin6ea2_operator_selections.json"
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


def draw_text(c: canvas.Canvas, text: str, x: float, y: float, width: float, *, size: float = 10,
              color=TEXT, font: str = "Helvetica", leading: float | None = None,
              max_lines: int | None = None) -> float:
    leading = leading or size * 1.28
    words = str(text).split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if stringWidth(candidate, font, size) <= width or not current:
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


def draw_title(c: canvas.Canvas, kicker: str, title: str, subtitle: str = "") -> None:
    c.setFillColor(BG)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(30, PAGE_H - 28, kicker.upper())
    c.setFont("Helvetica-Bold", 22)
    c.drawString(30, PAGE_H - 54, title)
    if subtitle:
        draw_text(c, subtitle, 30, PAGE_H - 72, PAGE_W - 60, size=9, color=MUTED)
    c.setStrokeColor(LINE)
    c.line(30, PAGE_H - 82, PAGE_W - 30, PAGE_H - 82)


def draw_footer(c: canvas.Canvas, page_number: int) -> None:
    c.setStrokeColor(LINE)
    c.line(30, 22, PAGE_W - 30, 22)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    c.drawString(30, 10, "RPGThreeJS | CIN-6E-A.2 | NON-PRODUCTION REVIEW")
    c.drawRightString(PAGE_W - 30, 10, f"PAGE {page_number}")


def prepared_image(path: Path) -> Path:
    digest = hashlib.sha256(path.read_bytes()).hexdigest()[:20]
    output = CACHE / f"{digest}.jpg"
    if output.exists():
        return output
    CACHE.mkdir(parents=True, exist_ok=True)
    with PILImage.open(path) as source:
        image = source.convert("RGBA")
        background = PILImage.new("RGBA", image.size, (9, 13, 20, 255))
        background.alpha_composite(image)
        flattened = background.convert("RGB")
        flattened.thumbnail((1600, 1200), PILImage.Resampling.LANCZOS)
        flattened.save(output, format="JPEG", quality=90, optimize=True, progressive=True)
    return output


def draw_image_fit(c: canvas.Canvas, path: Path, x: float, y: float, width: float, height: float,
                   *, background=PANEL, border=LINE) -> None:
    c.setFillColor(background)
    c.rect(x, y, width, height, fill=1, stroke=0)
    embedded_path = prepared_image(path)
    with PILImage.open(embedded_path) as image:
        iw, ih = image.size
    scale = min(width / iw, height / ih)
    dw, dh = iw * scale, ih * scale
    c.drawImage(str(embedded_path), x + (width - dw) / 2, y + (height - dh) / 2, dw, dh,
                preserveAspectRatio=True, mask="auto")
    c.setStrokeColor(border)
    c.rect(x, y, width, height, fill=0, stroke=1)


def draw_badge(c: canvas.Canvas, text: str, x: float, y: float, color, width: float | None = None) -> None:
    size = 8
    width = width or stringWidth(text, "Helvetica-Bold", size) + 16
    c.setFillColor(Color(color.red, color.green, color.blue, alpha=0.12))
    c.setStrokeColor(color)
    c.roundRect(x, y, width, 20, 5, fill=1, stroke=1)
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", size)
    c.drawCentredString(x + width / 2, y + 6, text)


def panel(c: canvas.Canvas, x: float, y: float, width: float, height: float, *, border=LINE) -> None:
    c.setFillColor(PANEL)
    c.setStrokeColor(border)
    c.roundRect(x, y, width, height, 6, fill=1, stroke=1)


def evidence_page(c: canvas.Canvas, page: int, source: dict, verdict: dict) -> None:
    pilot = source["pilotId"]
    passed = verdict["agentVerdict"] == "AGENT_VIDEO_PASS_PENDING_OPERATOR"
    color = PASS if passed else REJECT
    draw_title(c, "Temporal and cut evidence", f"Pilot {pilot} - Attempt 1",
               "Representative intervals, exact final decoded frame, cut analysis, cast continuity and HOLD decision.")
    draw_badge(c, verdict["agentVerdict"], PAGE_W - 265, PAGE_H - 62, color, 235)
    analysis_root = ROOT / Path(source["dynamicResult"]["analysisPath"]).parent
    frame_names = ["opening", "middle", "final"]
    image_y, image_h = 286, 190
    gap = 12
    image_w = (PAGE_W - 60 - gap * 2) / 3
    for index, name in enumerate(frame_names):
        x = 30 + index * (image_w + gap)
        draw_image_fit(c, analysis_root / f"frames/{name}.png", x, image_y, image_w, image_h)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8)
        c.drawString(x, image_y - 12, name.upper())
    panel(c, 30, 42, 390, 217, border=color)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(44, 238, "Character fidelity")
    y = 220
    for character_id, character in verdict["characters"].items():
        c.setFillColor(PASS if character["verdict"] == "PASS" else REJECT)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(44, y, f"{character_id.replace('_', ' ').title()}: {character['verdict']}")
        y = draw_text(c, character["evidence"], 44, y - 14, 360, size=7.4, color=MUTED,
                      leading=9.2, max_lines=4) - 5
    panel(c, 435, 42, PAGE_W - 465, 217, border=color)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(449, 238, "Gate results")
    facts = [
        ("INTERNAL_CUT_COUNT", verdict["cutAnalysis"]["INTERNAL_CUT_COUNT"]),
        ("CHARACTER_IDENTITY_BREAKS", verdict["temporalCharacterQA"]["CHARACTER_IDENTITY_BREAKS"]),
        ("CAST DISAPPEARANCE", verdict["temporalCharacterQA"]["UNEXPLAINED_CAST_DISAPPEARANCE"]),
        ("CAST ADDITIONS", verdict["temporalCharacterQA"]["UNEXPLAINED_CAST_ADDITION"]),
        ("WORLD_RESET", verdict["spatialContinuity"]["WORLD_RESET"]),
        ("SPATIAL_RESET", verdict["spatialContinuity"]["SPATIAL_RESET"]),
        ("FINAL_FRAME_HOLD_SAFE", verdict["finalFrame"]["FINAL_FRAME_HOLD_SAFE"]),
    ]
    y = 216
    for label, value in facts:
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8)
        c.drawString(449, y, label)
        c.setFillColor(PASS if str(value) in {"0", "PASS"} else REJECT)
        c.setFont("Helvetica-Bold", 8)
        c.drawRightString(PAGE_W - 44, y, str(value))
        y -= 19
    if verdict.get("rejectionReason"):
        draw_text(c, "REJECTED: " + verdict["rejectionReason"], 449, y - 3, PAGE_W - 493,
                  size=7.6, color=REJECT, leading=9.4, max_lines=4)
    draw_footer(c, page)
    c.showPage()


def source_page(c: canvas.Canvas, page: int, source: dict, verdict: dict) -> None:
    pilot = source["pilotId"]
    passed = verdict["agentVerdict"] == "AGENT_VIDEO_PASS_PENDING_OPERATOR"
    color = PASS if passed else REJECT
    draw_title(c, "Source and canonical identity", f"Pilot {pilot} - {source['assetCandidateId']}",
               f"Source SHA-256 {source['sourceSha256']} | canonical identity source: public/assets/characters/pixel/full/*.png")
    draw_badge(c, "OPERATOR_SOURCE_APPROVED", PAGE_W - 265, PAGE_H - 62, GOLD, 235)
    source_path = ROOT / source["sourcePath"]
    draw_image_fit(c, source_path, 30, 116, 555, 312)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(30, 102, "Exact immutable H3 first frame")
    refs = source["requiredCast"]
    ref_gap = 10
    ref_w = (PAGE_W - 625 - ref_gap * (len(refs) - 1)) / len(refs)
    for index, character in enumerate(refs):
        x = 600 + index * (ref_w + ref_gap)
        draw_image_fit(c, ROOT / f"public/assets/characters/pixel/full/{character}.png", x, 168, ref_w, 260)
        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(x + ref_w / 2, 154, character.replace("_", " ").title())
    panel(c, 600, 42, PAGE_W - 630, 94, border=color)
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(614, 116, verdict["agentVerdict"])
    if verdict.get("rejectionReason"):
        draw_text(c, verdict["rejectionReason"], 614, 98, PAGE_W - 658, size=7.5, color=TEXT,
                  leading=9.2, max_lines=5)
    else:
        draw_text(c, "The source and animated result preserve the authoritative cast identities. Operator visual approval remains required.",
                  614, 98, PAGE_W - 658, size=7.5, color=MUTED, leading=9.2, max_lines=5)
    draw_footer(c, page)
    c.showPage()


def build() -> None:
    selections = load_json(SELECTIONS)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=(PAGE_W, PAGE_H), pageCompression=1)
    c.setTitle("CIN-6E-A.2 Continuous Video Fidelity Gate")
    c.setAuthor("RPGThreeJS cinematic QA")

    draw_title(c, "RPGThreeJS", "CIN-6E-A.2 Continuous Video Fidelity Gate",
               "Selected H3 pilots C-B, E-A and F-A | non-production dynamic validation | operator review package")
    draw_badge(c, "DYNAMIC_VIDEO_GATE: NO", 30, PAGE_H - 120, REJECT, 190)
    draw_badge(c, "VISUAL_PRODUCTION_LOCK: NO", 232, PAGE_H - 120, REJECT, 215)
    c.setFillColor(TEXT)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(30, PAGE_H - 166, "Decision")
    draw_text(c, selections["dynamicGate"]["blocker"], 30, PAGE_H - 188, 765, size=11,
              color=REJECT, leading=14, max_lines=4)
    y = PAGE_H - 275
    for source in selections["selectedH3Sources"]:
        verdict = load_json(ROOT / source["dynamicResult"]["verdictPath"])
        passed = verdict["agentVerdict"] == "AGENT_VIDEO_PASS_PENDING_OPERATOR"
        color = PASS if passed else REJECT
        panel(c, 30, y - 66, PAGE_W - 60, 58, border=color)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(44, y - 29, f"PILOT {source['pilotId']} | ATTEMPT 1")
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(230, y - 29, verdict["agentVerdict"])
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8)
        c.drawString(44, y - 48, f"5.000 s | 1920x1080 | 24 fps | silent | cuts {verdict['cutAnalysis']['INTERNAL_CUT_COUNT']} | HOLD {verdict['finalFrame']['FINAL_FRAME_HOLD_SAFE']}")
        y -= 72
    draw_text(c, "NEW IMAGE GENERATIONS: 0 | PRODUCTION MEDIA CHANGED: NO | COMMIT: NO | PUSH: NO",
              30, 58, PAGE_W - 60, size=9, color=GOLD)
    draw_footer(c, 1)
    c.showPage()

    page = 2
    for source in selections["selectedH3Sources"]:
        verdict = load_json(ROOT / source["dynamicResult"]["verdictPath"])
        source_page(c, page, source, verdict)
        page += 1
        evidence_page(c, page, source, verdict)
        page += 1

    draw_title(c, "Cross-mode continuity", "Global same-game visual continuity",
               "GOLD references, static tableaux, Travel Still and representative C/E/F video frames.")
    draw_image_fit(c, ROOT / "tmp/cinematics/cin6ea/review/global-continuity-board.png", 30, 56, PAGE_W - 60, PAGE_H - 154)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(30, 38, "SAME_GAME_VISUAL_IDENTITY: HUMAN_REVIEW_REQUIRED")
    draw_footer(c, page)
    c.showPage()

    c.save()
    print(json.dumps({"pdf": str(OUTPUT.relative_to(ROOT)).replace("\\", "/"), "pages": page, "status": "CREATED"}, indent=2))


if __name__ == "__main__":
    build()
