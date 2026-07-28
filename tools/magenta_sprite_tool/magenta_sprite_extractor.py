#!/usr/bin/env python3
"""
magenta_sprite_extractor.py
============================

Outil local (hors-ligne) de suppression precise du fond magenta (#FF00FF)
sur des spritesheets, avec extraction automatique des sprites individuels
(sans bordures, sans halo magenta residuel).

Fonctionnement general
-----------------------
1. "Keying" du magenta : chaque pixel recoit un alpha en fonction de sa
   distance colorimetrique au magenta pur. Un pixel tres proche du magenta
   devient totalement transparent, un pixel tres eloigne reste totalement
   opaque, et les pixels intermediaires (anti-aliasing sur les bords des
   sprites) recoivent un alpha progressif.
2. "Despill" : sur les pixels d'anti-aliasing (alpha partiel), la couleur
   d'origine est reconstruite en retirant mathematiquement la contribution
   du fond magenta (decomposition du melange alpha), ce qui evite les
   liseres roses/magenta residuels autour des sprites.
3. Decoupe : deux modes disponibles
      - "grid"  : la feuille est divisee en une grille rows x cols fixe
                  (cases egales), puis chaque case est recadree sur son
                  contenu reel (bounding box), en retirant toute bordure
                  vide/magenta restante.
      - "auto"  : detection automatique des sprites par composantes
                  connexes (aucune grille supposee), utile pour des
                  feuilles avec un nombre/agencement variable de sprites,
                  ou pour regrouper des elements proches (particules,
                  effets detaches) via une dilatation reglable.
4. QC (controle qualite) : un rapport texte + une image de controle avec
   les boites de detection est genere pour verifier visuellement le
   resultat et reperer les sprites tronques (qui touchent le bord de
   l'image).

Utilisation rapide
-------------------
    # Nettoyer + extraire automatiquement les sprites d'une image
    python3 magenta_sprite_extractor.py mon_sheet.png --out sortie/

    # Feuille en grille connue (ex: 4 colonnes x 4 lignes, marche 4 directions)
    python3 magenta_sprite_extractor.py hero_walk.png --out sortie/ \
        --split grid --rows 4 --cols 4

    # Traitement en lot d'un dossier entier
    python3 magenta_sprite_extractor.py dossier_sheets/ --out sortie/ --recursive

Dependances : numpy, scipy, Pillow (toutes deja presentes dans cet
environnement).
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


# ---------------------------------------------------------------------------
# Coeur du keying magenta
# ---------------------------------------------------------------------------

MAGENTA = np.array([255, 0, 255], dtype=np.float32)


def load_rgba(path: Path) -> np.ndarray:
    """Charge une image en tableau numpy RGBA float32 (0-255)."""
    img = Image.open(path).convert("RGBA")
    return np.array(img, dtype=np.float32)


def magenta_key(
    rgba: np.ndarray,
    low_thresh: float = 30.0,
    high_thresh: float = 100.0,
    despill: bool = True,
) -> np.ndarray:
    """
    Calcule un alpha precis base sur la distance au magenta pur, puis
    retire (despill) la teinte magenta residuelle sur les pixels
    d'anti-aliasing.

    low_thresh  : distance en dessous de laquelle un pixel est considere
                  comme du fond magenta pur -> alpha = 0
    high_thresh : distance au dela de laquelle un pixel est considere
                  comme totalement opaque -> alpha = 255
    Entre les deux, l'alpha est interpole (bord anti-aliase).
    """
    rgb = rgba[..., :3]
    orig_alpha = rgba[..., 3:4]

    dist = np.sqrt(np.sum((rgb - MAGENTA) ** 2, axis=-1))

    # rampe lineaire + lissage (smoothstep) entre les deux seuils
    t = np.clip((dist - low_thresh) / max(high_thresh - low_thresh, 1e-6), 0.0, 1.0)
    smooth = t * t * (3 - 2 * t)  # smoothstep
    alpha = smooth * 255.0

    # un pixel deja transparent dans la source le reste
    alpha = np.minimum(alpha, orig_alpha[..., 0])

    out_rgb = rgb.copy()

    if despill:
        a_norm = np.clip(alpha / 255.0, 0.0, 1.0)
        edge_mask = (alpha > 0) & (alpha < 255)
        # decomposition du melange alpha : pixel = a*fg + (1-a)*magenta
        # => fg = (pixel - (1-a)*magenta) / a
        safe_a = np.where(edge_mask, a_norm, 1.0)[..., None]
        recovered = (rgb - (1.0 - safe_a) * MAGENTA) / safe_a
        recovered = np.clip(recovered, 0, 255)
        out_rgb = np.where(edge_mask[..., None], recovered, out_rgb)

    out = np.dstack([out_rgb, alpha]).astype(np.uint8)
    return out


# ---------------------------------------------------------------------------
# Detection / decoupe des sprites
# ---------------------------------------------------------------------------

@dataclass
class SpriteBox:
    label: int
    row0: int
    row1: int  # exclusif
    col0: int
    col1: int  # exclusif
    touches_edge: bool = False
    area: int = 0


def _bboxes_from_mask(mask: np.ndarray, dilate_px: int, min_area: int) -> list[SpriteBox]:
    """Composantes connexes sur un masque booleen -> liste de boites."""
    struct = None
    if dilate_px > 0:
        work_mask = ndimage.binary_dilation(mask, iterations=dilate_px)
    else:
        work_mask = mask

    labeled, n = ndimage.label(work_mask, structure=np.ones((3, 3)))
    slices = ndimage.find_objects(labeled)

    h, w = mask.shape
    boxes: list[SpriteBox] = []
    for i, sl in enumerate(slices, start=1):
        if sl is None:
            continue
        row_sl, col_sl = sl
        # on ne garde, pour la boite finale, que les pixels REELS (non
        # dilates) appartenant a ce label, afin de ne pas inclure la
        # dilatation dans le recadrage.
        real_pixels = mask[row_sl, col_sl] & (labeled[row_sl, col_sl] == i)
        area = int(real_pixels.sum())
        if area < min_area:
            continue
        r0, r1 = row_sl.start, row_sl.stop
        c0, c1 = col_sl.start, col_sl.stop
        touches = r0 == 0 or c0 == 0 or r1 == h or c1 == w
        boxes.append(SpriteBox(i, r0, r1, c0, c1, touches, area))
    return boxes


def detect_sprites_auto(alpha: np.ndarray, dilate_px: int, min_area: int) -> list[SpriteBox]:
    mask = alpha > 0
    return _bboxes_from_mask(mask, dilate_px, min_area)


def tight_crop_within(alpha: np.ndarray, r0: int, r1: int, c0: int, c1: int) -> tuple[int, int, int, int] | None:
    """Recadre au plus juste sur les pixels non transparents dans la zone."""
    sub = alpha[r0:r1, c0:c1]
    ys, xs = np.nonzero(sub > 0)
    if len(ys) == 0:
        return None
    return (r0 + ys.min(), r0 + ys.max() + 1, c0 + xs.min(), c0 + xs.max() + 1)


def keep_largest_component(alpha_region: np.ndarray) -> np.ndarray:
    """Ne garde que la plus grande composante connexe (filtre le bruit/debris)."""
    mask = alpha_region > 0
    if not mask.any():
        return alpha_region
    labeled, n = ndimage.label(mask, structure=np.ones((3, 3)))
    if n <= 1:
        return alpha_region
    sizes = ndimage.sum(mask, labeled, index=range(1, n + 1))
    biggest = np.argmax(sizes) + 1
    out = alpha_region.copy()
    out[labeled != biggest] = 0
    return out


# ---------------------------------------------------------------------------
# Sauvegarde
# ---------------------------------------------------------------------------

def save_sprite(rgba_clean: np.ndarray, box: tuple[int, int, int, int], margin: int,
                 out_path: Path) -> tuple[int, int]:
    r0, r1, c0, c1 = box
    h, w = rgba_clean.shape[:2]
    r0 = max(0, r0 - margin)
    c0 = max(0, c0 - margin)
    r1 = min(h, r1 + margin)
    c1 = min(w, c1 + margin)
    crop = rgba_clean[r0:r1, c0:c1]
    Image.fromarray(crop, mode="RGBA").save(out_path)
    return crop.shape[1], crop.shape[0]


def draw_debug_boxes(rgba_clean: np.ndarray, boxes: list[tuple[int, int, int, int]]) -> Image.Image:
    base = Image.fromarray(rgba_clean, mode="RGBA").convert("RGB")
    draw = ImageDraw.Draw(base)
    for (r0, r1, c0, c1) in boxes:
        draw.rectangle([c0, r0, c1 - 1, r1 - 1], outline=(0, 255, 0), width=2)
    return base


# ---------------------------------------------------------------------------
# Pipelines haut niveau
# ---------------------------------------------------------------------------

def process_image(
    path: Path,
    out_dir: Path,
    split: str = "auto",
    rows: int = 1,
    cols: int = 1,
    low_thresh: float = 30.0,
    high_thresh: float = 100.0,
    despill: bool = True,
    dilate_px: int = 3,
    min_area: int = 40,
    margin: int = 2,
    component_mode: str = "all",
    save_sheet: bool = True,
    save_debug: bool = True,
) -> dict:
    name = path.stem
    img_out_dir = out_dir / name
    img_out_dir.mkdir(parents=True, exist_ok=True)

    rgba_src = load_rgba(path)
    rgba_clean = magenta_key(rgba_src, low_thresh, high_thresh, despill)
    alpha = rgba_clean[..., 3]

    if save_sheet:
        Image.fromarray(rgba_clean, mode="RGBA").save(img_out_dir / f"{name}-sheet-transparent.png")

    boxes_final: list[tuple[int, int, int, int]] = []
    exported = []
    warnings = []

    if split == "none":
        pass  # seulement la feuille nettoyee, pas de decoupe

    elif split == "grid":
        h, w = alpha.shape
        cell_h = h / rows
        cell_w = w / cols
        idx = 0
        for r in range(rows):
            for c in range(cols):
                r0, r1 = int(round(r * cell_h)), int(round((r + 1) * cell_h))
                c0, c1 = int(round(c * cell_w)), int(round((c + 1) * cell_w))

                region_alpha = alpha[r0:r1, c0:c1].copy()
                if component_mode == "largest":
                    region_alpha = keep_largest_component(region_alpha)
                    tmp_full = np.zeros_like(alpha)
                    tmp_full[r0:r1, c0:c1] = region_alpha
                    working_alpha = tmp_full
                else:
                    working_alpha = alpha

                crop = tight_crop_within(working_alpha, r0, r1, c0, c1)
                idx += 1
                if crop is None:
                    warnings.append(f"case grille ({r},{c}) : vide (rien detecte, ignoree)")
                    continue
                cr0, cr1, cc0, cc1 = crop
                touches_edge = bool(cr0 == 0 or cc0 == 0 or cr1 == h or cc1 == w)
                if touches_edge:
                    warnings.append(
                        f"case grille ({r},{c}) : le sprite touche le bord de l'image "
                        f"(risque de recadrage tronque)"
                    )
                out_name = f"{name}_r{r}_c{c}.png"
                w_px, h_px = save_sprite(
                    np.dstack([rgba_clean[..., :3], working_alpha.astype(np.uint8)]),
                    (cr0, cr1, cc0, cc1), margin, img_out_dir / out_name,
                )
                boxes_final.append((cr0, cr1, cc0, cc1))
                exported.append({"file": out_name, "row": r, "col": c, "w": w_px, "h": h_px,
                                  "touches_edge": touches_edge})

    elif split == "auto":
        sprite_boxes = detect_sprites_auto(alpha, dilate_px, min_area)
        for sb in sprite_boxes:
            region_alpha = alpha.copy()
            # isole cette region : hors bbox -> 0 (evite d'attraper un sprite voisin)
            mask_region = np.zeros_like(alpha, dtype=bool)
            mask_region[sb.row0:sb.row1, sb.col0:sb.col1] = True
            working_alpha = np.where(mask_region, region_alpha, 0)

            if component_mode == "largest":
                sub = working_alpha[sb.row0:sb.row1, sb.col0:sb.col1]
                sub = keep_largest_component(sub)
                working_alpha = np.zeros_like(alpha)
                working_alpha[sb.row0:sb.row1, sb.col0:sb.col1] = sub

            crop = tight_crop_within(working_alpha, sb.row0, sb.row1, sb.col0, sb.col1)
            if crop is None:
                continue
            cr0, cr1, cc0, cc1 = crop
            if sb.touches_edge:
                warnings.append(
                    f"sprite #{sb.label} : touche le bord de l'image "
                    f"(risque de recadrage tronque)"
                )
            out_name = f"{name}_sprite{sb.label:03d}.png"
            w_px, h_px = save_sprite(
                np.dstack([rgba_clean[..., :3], working_alpha.astype(np.uint8)]),
                (cr0, cr1, cc0, cc1), margin, img_out_dir / out_name,
            )
            boxes_final.append((cr0, cr1, cc0, cc1))
            exported.append({"file": out_name, "w": w_px, "h": h_px,
                              "area": sb.area, "touches_edge": sb.touches_edge})
    else:
        raise ValueError(f"mode de decoupe inconnu: {split}")

    if save_debug and boxes_final:
        dbg = draw_debug_boxes(rgba_clean, boxes_final)
        dbg.save(img_out_dir / f"{name}-debug-boxes.png")

    report = {
        "source": str(path),
        "split_mode": split,
        "sprites_exported": len(exported),
        "sprites": exported,
        "warnings": warnings,
    }
    with open(img_out_dir / f"{name}-report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    return report


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Suppression precise du fond magenta (#FF00FF) et extraction des "
                    "sprites individuels d'une ou plusieurs spritesheets."
    )
    p.add_argument("input", type=str,
                    help="Image source, ou dossier si --recursive est utilise.")
    p.add_argument("--out", type=str, default="output",
                    help="Dossier de sortie (defaut: ./output)")
    p.add_argument("--recursive", action="store_true",
                    help="Traite toutes les images (.png/.jpg/.jpeg/.bmp) d'un dossier.")

    p.add_argument("--split", choices=["auto", "grid", "none"], default="auto",
                    help="auto = detection automatique des sprites (defaut) ; "
                         "grid = grille fixe rows x cols ; none = nettoyage seul, pas de decoupe.")
    p.add_argument("--rows", type=int, default=1, help="Nombre de lignes (mode grid).")
    p.add_argument("--cols", type=int, default=1, help="Nombre de colonnes (mode grid).")

    p.add_argument("--low-thresh", type=float, default=30.0,
                    help="Distance couleur en dessous de laquelle un pixel = fond pur (defaut 30).")
    p.add_argument("--high-thresh", type=float, default=100.0,
                    help="Distance couleur au-dela de laquelle un pixel = opaque (defaut 100).")
    p.add_argument("--no-despill", action="store_true",
                    help="Desactive la correction du halo magenta sur les bords anti-alises.")

    p.add_argument("--dilate", type=int, default=3,
                    help="Rayon (px) de fusion des fragments proches en mode auto "
                         "(utile pour regrouper particules/effets detaches). Defaut 3.")
    p.add_argument("--min-area", type=int, default=40,
                    help="Aire minimale (px) pour qu'un fragment soit considere comme un "
                         "sprite en mode auto (filtre le bruit). Defaut 40.")
    p.add_argument("--margin", type=int, default=2,
                    help="Marge (px) conservee autour de chaque sprite recadre. Defaut 2.")
    p.add_argument("--component-mode", choices=["all", "largest"], default="all",
                    help="'largest' ne garde que le plus gros fragment connecte par sprite "
                         "(supprime les debris isoles).")

    p.add_argument("--no-sheet", action="store_true",
                    help="Ne pas sauvegarder la feuille complete nettoyee.")
    p.add_argument("--no-debug", action="store_true",
                    help="Ne pas generer l'image de controle avec les boites de detection.")
    return p


def gather_inputs(input_path: Path, recursive: bool) -> list[Path]:
    exts = {".png", ".jpg", ".jpeg", ".bmp", ".webp"}
    if input_path.is_dir():
        if not recursive:
            raise SystemExit(
                f"{input_path} est un dossier : ajoutez --recursive pour traiter toutes ses images."
            )
        return sorted(p for p in input_path.rglob("*") if p.suffix.lower() in exts)
    return [input_path]


def main(argv: list[str] | None = None) -> int:
    args = build_arg_parser().parse_args(argv)
    input_path = Path(args.input)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    files = gather_inputs(input_path, args.recursive)
    if not files:
        print("Aucune image trouvee.", file=sys.stderr)
        return 1

    total_sprites = 0
    for f in files:
        print(f"-> Traitement de {f} ...")
        report = process_image(
            f, out_dir,
            split=args.split, rows=args.rows, cols=args.cols,
            low_thresh=args.low_thresh, high_thresh=args.high_thresh,
            despill=not args.no_despill,
            dilate_px=args.dilate, min_area=args.min_area, margin=args.margin,
            component_mode=args.component_mode,
            save_sheet=not args.no_sheet, save_debug=not args.no_debug,
        )
        total_sprites += report["sprites_exported"]
        print(f"   {report['sprites_exported']} sprite(s) exporte(s).")
        for w in report["warnings"]:
            print(f"   [!] {w}")

    print(f"\nTermine. {total_sprites} sprite(s) exporte(s) au total dans '{out_dir}'.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
