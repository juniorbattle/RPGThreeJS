# CIN-6E-A Character Fidelity

Finalization baseline: `57ba69cf718ea630cc9306c4122666fd6b58420f`

All 22 character production cards remain backed by canonical full-sprite SHA-256 hashes and QC alpha bounds. The absolute authority is `public/assets/characters/pixel/full/*.png`, applied independently per character. Static tableaux continue to use canonical runtime sprites unchanged.

The six-pilot review passed character fidelity. For the selected dynamic pilots C, E-C, and F, identity breaks and mask breaks are both zero. The E-A and E-B rejections prove that canonical face concealment remains a hard gate: E-A exposes Kestrel's lower face, while E-B loses Cedric's metal mask. Approved E-C restores both canonical masks.
