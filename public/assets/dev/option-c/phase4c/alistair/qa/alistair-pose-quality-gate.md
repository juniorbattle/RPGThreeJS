# Alistair key-pose quality gate

Status: **PASS**

Selected set: idle A001, dash A003, attack A001, skill A001. Six pose requests were made in total.

The first dash was rejected after operator review exposed a real anatomical-size drift. The original normalizer had incorrectly forced every pose to the same vertical helmet-to-foot height, which enlarged a crouched dash. After replacing that rule with one master-derived scale, the source drift remained visible. Dash A002 corrected the scale but retained enough crouch and perspective to make the upper body read too large relative to the legs, so it was also rejected. Dash A003 was regenerated from the approved master without either rejected dash as a visual reference, using a near-orthographic running lunge and explicit helmet, torso, limb, boot, and weapon module locks.

The accepted set now uses exactly one source-to-frame scale (`0.19309427599639523`) and translation-only foot/pivot alignment. Dash A003 has a 293 px normalized body height versus 296 px for attack and 286 px for skill; idle remains taller at 333 px because it is upright. Crouched or wide poses are naturally shorter in vertical extent; they are not independently resized.

Consistency gates for identity, anatomy, helmet, armor, weapon, palette, limbs, action readability, no baked VFX, and pixel language all pass. The representative skill is repository-defined `w_whirl` / `Tourbillon d’Acier`.
