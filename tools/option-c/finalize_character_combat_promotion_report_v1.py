import json
from pathlib import Path


root = Path(__file__).resolve().parents[2]
qa = root / "public/assets/dev/option-c/final-character-combat-promotion-v1/qa/promotion-report.json"
baseline_path = root / "public/assets/dev/option-c/hero-scale-parity-v1/candidate/manifests/protected-assets-before.json"
report = json.loads(qa.read_text(encoding="utf-8"))
baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
report["baselineHashGuard"] = {
    "productionMasters": baseline["productionMasters"],
    "productionCombatPoses": baseline["productionCombatPoses"],
}
report["approvedCandidateHashes"] = {
    "lancer/master": "4cb15e26e168985a56666becf3c4d14ef8c35a95f784940f17e5a894b21a278d",
    "lancer/prepare": "71a8d68f765367eefe2317e1fea6b0d82c1957968d5208a23b57bc28a6f3fcfa",
    "lancer/dash": "9d89be015f5292e3a04131da8791ebc7e3ddd6fbc56b461d417011acf277eb8f",
    "lancer/attack": "2c57235b843c667e7a4c993ae2da695d38c683dfbe25ea12fe848265c7be916d",
    "lancer/cast": "1c6f58d989f5300b8f1c6c5b0f823c4ad149627cec92ea37094ce3b71592d8ca",
    "village_militia_spearman/prepare": "11c0f6ec9872b21dd2d731205bd74601c41cecf94c6d1353bf195a63d21d71c8",
    "village_militia_spearman/dash": "71229a34a8a8ee7e59febb9d2d0beb960b84416e2246190e864d4d915e79dcd8",
    "village_militia_spearman/attack": "71fc6aa2822529e6b8d77e258ea238b7e3a3d3b5483b0c55b486705a1708e16b",
    "village_militia_spearman/cast": "24e2f9a166522c85378d5f02e7f68168c6bd4ab410e5eb59d2f239be0a128961",
    "village_militia_slinger/prepare": "83e28be13f380a00f78fb8f7aa163138a9b1e7ad825deb072a0b06184ea10fb4",
    "village_militia_slinger/dash": "27f1d5a296de9ce42b2d5725e46d9fafd6477a3a06fbc7163d0c2515e94634f8",
    "village_militia_slinger/attack": "444f612f3ead4fb60242458d4884d1dcd0de3fef4dc9d791bbe69ea463526b14",
    "village_militia_slinger/cast": "9066d47ced7bf92cdb7ef6b0a8f2f7fa5de43febd43d373211069360a3d3c9b0",
}
qa.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"status": report["status"], "baselineMasters": report["baselineHashGuard"]["productionMasters"]["fileCount"], "baselineCombatPoses": report["baselineHashGuard"]["productionCombatPoses"]["fileCount"], "candidateHashes": len(report["approvedCandidateHashes"])}, indent=2))
