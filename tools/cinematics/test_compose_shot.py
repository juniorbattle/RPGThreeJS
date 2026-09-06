import hashlib
import tempfile
import unittest
from pathlib import Path

from PIL import Image

from compose_shot import _sealed_artefact, compose_shot, orient_character, placement_box, scale_to_height, sha256


class ComposeShotTests(unittest.TestCase):
    def test_orientation_is_exact_and_does_not_mutate_source(self):
        image = Image.new("RGBA", (3, 2), (0, 0, 0, 0))
        image.putpixel((0, 0), (255, 0, 0, 255))
        image.putpixel((2, 1), (0, 0, 255, 255))
        original = image.tobytes()
        right = orient_character(image, "SCREEN_RIGHT")
        left = orient_character(image, "SCREEN_LEFT")
        self.assertEqual(right.tobytes(), original)
        self.assertEqual(left.tobytes(), image.transpose(Image.Transpose.FLIP_LEFT_RIGHT).tobytes())
        self.assertEqual(image.tobytes(), original)

    def test_scale_and_normalized_placement_are_deterministic(self):
        image = Image.new("RGBA", (40, 80), (255, 255, 255, 255))
        scaled = scale_to_height(image, 400)
        self.assertEqual(scaled.size, (200, 400))
        character = {"position": {"x": 0.25, "groundY": 0.9}}
        self.assertEqual(placement_box(character, scaled.size, (1920, 1080)), (380, 572, 580, 972))

    def test_sealed_artefact_overlay_is_deterministic_and_visible(self):
        first = _sealed_artefact(96)
        second = _sealed_artefact(96)
        self.assertEqual(first.tobytes(), second.tobytes())
        self.assertIsNotNone(first.getchannel("A").getbbox())

    def test_composite_sorts_depth_back_to_front_and_preserves_assets(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "assets").mkdir()
            environment = Image.new("RGB", (1920, 1080), (24, 24, 24))
            environment.save(root / "assets" / "environment.png")
            red = Image.new("RGBA", (10, 20), (255, 0, 0, 255))
            blue = Image.new("RGBA", (10, 20), (0, 0, 255, 255))
            red.save(root / "assets" / "red.png")
            blue.save(root / "assets" / "blue.png")
            red_before = sha256(root / "assets" / "red.png")
            blue_before = sha256(root / "assets" / "blue.png")
            spec = {"sequenceId": "test", "cinematicId": "test", "tier": "HERO", "frame": {"width": 1920, "height": 1080}}
            shot = {
                "shotId": "shot_01", "source": {"type": "ROOT_SOURCE"}, "environment": "assets/environment.png",
                "characters": [
                    {"id": "front", "asset": "assets/red.png", "position": {"x": 0.5, "groundY": 0.5}, "heightPx": 200, "facing": "SCREEN_RIGHT", "depth": 20, "role": "SECONDARY", "action": "STAND", "lookTarget": "NONE"},
                    {"id": "back", "asset": "assets/blue.png", "position": {"x": 0.5, "groundY": 0.5}, "heightPx": 200, "facing": "SCREEN_RIGHT", "depth": 10, "role": "SECONDARY", "action": "STAND", "lookTarget": "NONE"},
                ],
            }
            frame, metadata = compose_shot(spec, shot, root)
            self.assertEqual(frame.getpixel((960, 440)), (255, 0, 0))
            self.assertEqual([entry["id"] for entry in metadata["placementsBackToFront"]], ["back", "front"])
            self.assertEqual(sha256(root / "assets" / "red.png"), red_before)
            self.assertEqual(sha256(root / "assets" / "blue.png"), blue_before)


if __name__ == "__main__":
    unittest.main()
