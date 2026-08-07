import { decodePng, detectGridV2 } from './r1_2_1_grid_detector_v2.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = 'C:\\Users\\miche\\Documents\\VFX_Library\\CartoonCoffeeMegaPack';
const files = [
  '01_extracted/Sword Slash VFX Spritesheets/Blue Slash v1 - Flurry_spritesheet.png',
  '01_extracted/Sword Slash VFX Spritesheets/Lightning Slash v1 - Flurry_spritesheet.png',
  '01_extracted/Essentials VFX Spritesheets/Shield_On_spritesheet.png',
  '01_extracted/Essentials VFX Spritesheets/Impact_Darkness_Lv3_spritesheet.png',
  '01_extracted/Sword Slash VFX Spritesheets/Fire Slash v1 - Spin_spritesheet.png',
  '01_extracted/Wind VFX Spritesheets/Dash_Wind_White_v3_spritesheet.png',
  '01_extracted/Essentials VFX Spritesheets/Flamethrower_001_spritesheet.png',
  '01_extracted/Essentials VFX Spritesheets/Positive_Buff_V3_spritesheet.png',
  '01_extracted/Essentials VFX Spritesheets/Heart_Buff_V3_spritesheet.png',
  '01_extracted/Wind VFX Spritesheets/Angry_Smoke_Burst_White_v2_A_spritesheet.png',
  '01_extracted/Essentials VFX Spritesheets/Healing_V3_spritesheet.png',
  '01_extracted/Essentials VFX Spritesheets/Hex_Bursts_Center_V2_spritesheet.png',
];

let allCorrect = true;
for (const f of files) {
  const buf = readFileSync(join(root, f));
  const dec = decodePng(buf);
  const r = detectGridV2(dec.data, dec.width, dec.height, f);
  const gap = r.hypotheses[0] ? (r.hypotheses[0].score - (r.hypotheses[1]?.score || 0)).toFixed(1) : 'N/A';
  const correct = r.cols === 8 && r.rows === 8;
  if (!correct) allCorrect = false;
  const name = f.split('/').pop().padEnd(50);
  console.log(`${name} ${r.cols}x${r.rows}  ${r.confidence.padEnd(10)} gap:${gap}  ${correct ? 'OK' : 'FAIL'}`);
  if (!correct) {
    const h8 = r.hypotheses.find(h => h.cols === 8 && h.rows === 8);
    const h4 = r.hypotheses.find(h => h.cols === 4 && h.rows === 4);
    console.log(`  8x8: score=${h8?.score} subCellSep=${h8?.subCellSep} continuity=${h8?.frameContinuity} active=${h8?.activeCells} empty=${h8?.emptyCells} drift=${h8?.avgCenterDrift}`);
    console.log(`  4x4: score=${h4?.score} subCellSep=${h4?.subCellSep} continuity=${h4?.frameContinuity} active=${h4?.activeCells} empty=${h4?.emptyCells} drift=${h4?.avgCenterDrift}`);
  }
}

console.log(`\nAll 12 pilot files detected as 8x8: ${allCorrect}`);
