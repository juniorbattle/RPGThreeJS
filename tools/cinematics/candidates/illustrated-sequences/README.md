# Offline illustrated candidates

Run from the repository root:

```powershell
node tools/cinematics/candidates/illustrated-sequences/reader-v1/serve.cjs
```

Open `http://127.0.0.1:5461/index.html`; stop with Ctrl+C. Set `ILLUSTRATED_PREVIEW_PORT` if5461 is occupied. The server binds localhost and serves only this candidate directory. A static HTTP server is required for module/timeline loading; opening HTML directly from the filesystem is not the playback path.

The gallery links only real candidate media and displays actual queue status. Audience, Bois-Clair arrival, saved and sacrificed are READY_FOR_OPERATOR_REVIEW. Lion judgement is NEEDS_CORRECTION: its reader passed10checks, but final03→04 lowers attention. Serpent ending is READY_FOR_OPERATOR_REVIEW after its own18s/10check proof and independent scoped review; its tested HTML footer remains archived pending text, with current status in review-closeout.json. Lion trial ending has five selected18s images and is GENERATED_REVIEW_PENDING; its own continuous proof remains pending. Final art and runtime adoption remain separate operator decisions.

`reader-v1/montage.mjs` and CSS are reused from the camp, with timeline/count/fade parameters read from each `sequence.json`; transport/keyboard/reduction/error behavior retained. Keep these versioned files and the audience smoke driver byte-identical after proof. To verify another scene, copy the smoke into that scene's version, adapt count/times/paths without weakening assertions, and register a new receipt. Do not overwrite historical proof or falsely inherit media acceptance from the shared reader.

Exact requests/results, raw variants, source context, input/output SHA and review limits live in each scene version. No source/public/game manifest/save/audio/video changes are part of this directory.

Lion-trial v2 : quatre plans repris et final corrigé ; propre18s preuve PENDING. V1 dixcontrôles techniques PASS mais raccord04→05 NEEDS_CORRECTION (échelle/appuis). Aucun reçu transféré ni artfinal/runtime accepté.
