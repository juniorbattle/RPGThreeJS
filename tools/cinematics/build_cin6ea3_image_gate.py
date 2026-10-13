from __future__ import annotations

import hashlib
import html
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path.cwd()
REVIEW_DIR = ROOT / "tmp/cinematics/cin6ea/review/cin6ea3"
SOURCE_DIR = ROOT / "tmp/cinematics/cin6ea/execution/images"
EC = SOURCE_DIR / "pilot_e_cinematic_keyframe_c/pilot_e_cinematic_keyframe_c.png"
EA = SOURCE_DIR / "pilot_e_cinematic_keyframe_a/pilot_e_cinematic_keyframe_a.png"
EB = SOURCE_DIR / "pilot_e_cinematic_keyframe_b/pilot_e_cinematic_keyframe_b.png"
CEDRIC = ROOT / "public/assets/characters/pixel/masters/rogue.png"
KESTREL = ROOT / "public/assets/characters/pixel/masters/archer.png"
PROVENANCE = SOURCE_DIR / "pilot_e_cinematic_keyframe_c/provenance.json"
BOARD = REVIEW_DIR / "pilot-e-image-fidelity-gate.png"
GATE_JSON = ROOT / "tools/cinematics/specs/cin6ea3_pilot_e_image_gate.json"
HTML = REVIEW_DIR / "index.html"


GATES = [
    ("CEDRIC_MASK", "PASS", "Closed dark metallic mask remains clearly visible."),
    ("CEDRIC_FACE_CONCEALED", "PASS", "No human facial anatomy is exposed."),
    ("KESTREL_CLOTH_MASK", "PASS", "Opaque green cloth mask restored under the hood."),
    ("KESTREL_NOSE_CONCEALED", "PASS", "Nose is fully covered by green cloth."),
    ("KESTREL_MOUTH_CONCEALED", "PASS", "Mouth and lips are fully covered."),
    ("KESTREL_JAW_CONCEALED", "PASS", "Jaw, chin and lower-face skin are fully covered."),
    ("CEDRIC_WEAPONS", "PASS", "Paired curved blades remain present."),
    ("KESTREL_LONGBOW", "PASS", "Longbow, drawn arrow and quiver remain present."),
    ("SILHOUETTES", "PASS", "Canonical agile assassin and ranger silhouettes remain readable."),
    ("PALETTES", "PASS", "Cedric purple/brown and Kestrel green/brown palettes remain stable."),
    ("NO_COLLAGE_LOOK", "PASS", "Characters share the scene's light, depth and material response."),
    ("GROUNDING", "PASS", "Both characters retain convincing road contact and shared scale."),
    ("WORLD_INTEGRATION", "PASS", "Forest Road family, atmosphere and perspective remain coherent."),
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    choices = [
        Path("C:/Windows/Fonts/seguisb.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
    ]
    for choice in choices:
        if choice.exists():
            return ImageFont.truetype(str(choice), size)
    return ImageFont.load_default()


def contain(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    copy = image.convert("RGBA")
    copy.thumbnail(size, Image.Resampling.LANCZOS)
    return copy


def card(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], title: str) -> None:
    draw.rounded_rectangle(box, radius=18, fill=(24, 28, 34, 255), outline=(92, 105, 119, 255), width=2)
    draw.text((box[0] + 18, box[1] + 14), title, font=font(28, True), fill=(232, 194, 112, 255))


def paste_center(canvas: Image.Image, image: Image.Image, box: tuple[int, int, int, int]) -> None:
    fitted = contain(image, (box[2] - box[0], box[3] - box[1]))
    x = box[0] + (box[2] - box[0] - fitted.width) // 2
    y = box[1] + (box[3] - box[1] - fitted.height) // 2
    canvas.alpha_composite(fitted, (x, y))


def build_board() -> None:
    canvas = Image.new("RGBA", (2560, 1440), (12, 15, 19, 255))
    draw = ImageDraw.Draw(canvas)
    draw.text((42, 26), "CIN-6E-A.3 — PILOT E IMAGE FIDELITY GATE", font=font(46, True), fill=(245, 224, 176, 255))
    draw.text((44, 82), "E-C exact-model precision edit · Agent image gate PASS · Operator source approval required before H3", font=font(25), fill=(178, 191, 204, 255))

    ec = Image.open(EC)
    card(draw, (36, 128, 1486, 956), "NEW SOURCE E-C — 1920×1080")
    paste_center(canvas, ec, (52, 180, 1470, 940))

    cedric = Image.open(CEDRIC)
    kestrel = Image.open(KESTREL)
    card(draw, (1510, 128, 2005, 790), "CANONICAL CEDRIC")
    paste_center(canvas, cedric, (1530, 180, 1985, 770))
    card(draw, (2025, 128, 2520, 790), "CANONICAL KESTREL")
    paste_center(canvas, kestrel, (2045, 180, 2500, 770))

    face_specs = [
        ("E-C CEDRIC", ec.crop((570, 180, 930, 510))),
        ("CANON CEDRIC", cedric.crop((250, 50, 500, 310))),
        ("E-C KESTREL", ec.crop((910, 160, 1270, 500))),
        ("CANON KESTREL", kestrel.crop((220, 90, 500, 360))),
    ]
    for index, (label, image) in enumerate(face_specs):
        x = 36 + index * 362
        card(draw, (x, 980, x + 342, 1398), label)
        paste_center(canvas, image, (x + 12, 1032, x + 330, 1384))

    draw.rounded_rectangle((1510, 820, 2520, 1398), radius=18, fill=(24, 28, 34, 255), outline=(92, 105, 119, 255), width=2)
    draw.text((1532, 842), "FIDELITY VALUES", font=font(30, True), fill=(232, 194, 112, 255))
    for index, (name, status, _) in enumerate(GATES):
        col = index // 7
        row = index % 7
        x = 1532 + col * 492
        y = 900 + row * 66
        draw.text((x, y), name, font=font(20, True), fill=(219, 227, 233, 255))
        draw.text((x, y + 27), status, font=font(20, True), fill=(102, 213, 151, 255))

    canvas.convert("RGB").save(BOARD, quality=95)


def build_gate_json() -> dict:
    provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
    result = {
        "schemaVersion": 1,
        "mission": "CIN-6E-A.3",
        "baseline": "6683c6d3898db0216549c43f7d25c7d8fd46d70d",
        "scope": "PILOT_E_SOURCE_REPAIR_ONLY",
        "candidate": {
            "id": "pilot_e_cinematic_keyframe_c",
            "path": EC.relative_to(ROOT).as_posix(),
            "sha256": sha256(EC),
            "dimensions": [1920, 1080],
            "model": provenance["model"],
            "quality": provenance["quality"],
            "generationType": provenance["generationType"],
            "parentCandidate": "pilot_e_cinematic_keyframe_a",
            "provenancePath": PROVENANCE.relative_to(ROOT).as_posix(),
        },
        "canonicalReferences": {
            "cedric": {"path": CEDRIC.relative_to(ROOT).as_posix(), "sha256": sha256(CEDRIC)},
            "kestrel": {"path": KESTREL.relative_to(ROOT).as_posix(), "sha256": sha256(KESTREL)},
        },
        "rejectedSources": {
            "E-A": {"path": EA.relative_to(ROOT).as_posix(), "sha256": sha256(EA), "reason": "Kestrel canonical green cloth face mask absent."},
            "E-B": {"path": EB.relative_to(ROOT).as_posix(), "sha256": sha256(EB), "reason": "Cedric canonical metal face mask absent."},
        },
        "gates": [{"id": name, "status": status, "evidence": evidence} for name, status, evidence in GATES],
        "agentImageVerdict": "AGENT_IMAGE_PASS_PENDING_OPERATOR",
        "h3Submission": "NOT_STARTED_PENDING_OPERATOR_SOURCE_APPROVAL",
        "videoGenerationStarted": False,
        "protectedState": {
            "pilotsCAndF": "OPERATOR_APPROVED_UNCHANGED",
            "productionMediaChanged": False,
            "productionManifestChanged": False,
            "canonicalSpritesChanged": False,
            "commit": False,
            "push": False,
        },
        "reviewBoard": BOARD.relative_to(ROOT).as_posix(),
        "reviewViewer": HTML.relative_to(ROOT).as_posix(),
    }
    GATE_JSON.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return result


def build_html(result: dict) -> None:
    rows = "\n".join(
        f"<tr><td>{html.escape(gate['id'])}</td><td class='pass'>{gate['status']}</td><td>{html.escape(gate['evidence'])}</td></tr>"
        for gate in result["gates"]
    )
    document = f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CIN-6E-A.3 Pilot E Image Fidelity Gate</title>
<style>
body{{margin:0;background:#0c0f13;color:#e7edf2;font:16px/1.45 Segoe UI,Arial,sans-serif}}main{{max-width:1600px;margin:auto;padding:30px}}h1,h2{{color:#f2d69a}}.status{{color:#68d697;font-weight:800}}img{{max-width:100%;height:auto;display:block}}.hero,.panel{{background:#181c22;border:1px solid #56616c;border-radius:14px;padding:18px;margin:20px 0}}.refs{{display:grid;grid-template-columns:1fr 1fr;gap:18px}}.refs img{{max-height:720px;margin:auto}}table{{width:100%;border-collapse:collapse}}td,th{{padding:10px;border-bottom:1px solid #39414a;text-align:left}}.pass{{color:#68d697;font-weight:800}}a{{color:#f2d69a}}code{{color:#d5e7f3}}@media(max-width:900px){{.refs{{grid-template-columns:1fr}}}}
</style></head><body><main>
<h1>CIN-6E-A.3 — Pilot E Image Fidelity Gate</h1>
<p class="status">AGENT_IMAGE_PASS_PENDING_OPERATOR</p>
<p>Exact model: <code>{html.escape(result['candidate']['model'])}</code> · quality=max · H3 NOT STARTED.</p>
<section class="hero"><h2>New candidate E-C</h2><a href="../../execution/images/pilot_e_cinematic_keyframe_c/pilot_e_cinematic_keyframe_c.png"><img src="../../execution/images/pilot_e_cinematic_keyframe_c/pilot_e_cinematic_keyframe_c.png" alt="Pilot E-C"></a></section>
<section class="panel"><h2>Face and canonical comparison board</h2><a href="pilot-e-image-fidelity-gate.png"><img src="pilot-e-image-fidelity-gate.png" alt="CIN-6E-A.3 fidelity board"></a></section>
<section class="panel"><h2>Canonical references</h2><div class="refs"><img src="../../../../../public/assets/characters/pixel/masters/rogue.png" alt="Canonical Cedric"><img src="../../../../../public/assets/characters/pixel/masters/archer.png" alt="Canonical Kestrel"></div></section>
<section class="panel"><h2>Gate values</h2><table><thead><tr><th>Gate</th><th>Status</th><th>Evidence</th></tr></thead><tbody>{rows}</tbody></table></section>
<section class="panel"><h2>Rejected comparison sources</h2><div class="refs"><figure><figcaption>E-A — Kestrel mask absent</figcaption><img src="../../execution/images/pilot_e_cinematic_keyframe_a/pilot_e_cinematic_keyframe_a.png" alt="Rejected E-A"></figure><figure><figcaption>E-B — Cedric mask absent</figcaption><img src="../../execution/images/pilot_e_cinematic_keyframe_b/pilot_e_cinematic_keyframe_b.png" alt="Rejected E-B"></figure></div></section>
</main></body></html>"""
    HTML.write_text(document, encoding="utf-8")


REVIEW_DIR.mkdir(parents=True, exist_ok=True)
build_board()
gate_result = build_gate_json()
build_html(gate_result)
print(json.dumps({
    "status": gate_result["agentImageVerdict"],
    "candidateSha256": gate_result["candidate"]["sha256"],
    "gateCount": len(gate_result["gates"]),
    "gatePassCount": sum(gate["status"] == "PASS" for gate in gate_result["gates"]),
    "board": gate_result["reviewBoard"],
    "viewer": gate_result["reviewViewer"],
}, indent=2))
