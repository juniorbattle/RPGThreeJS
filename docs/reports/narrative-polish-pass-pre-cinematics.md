# Narrative Polish Pass — Pre-Cinematics

## Status

Branch: `narrative-polish-pass`  
Baseline: `e749b8227435bcbd8efefdc9bcdf53f6e63c419f`  
Scope: final writing polish plus one bounded judgement-resolution refinement for Alaric bluffing.

## Non-negotiable lock preserved

This pass does **not** change:
- campaign topology;
- node IDs or links;
- canonical route selection, boss selection or ending IDs;
- reputation/gold/item values;
- combat IDs;
- save schema;
- the Conduct / Witness / Shadow / Reputation verdict architecture.

One localized judgement rule is added: Alaric can accept a bluff that reframes a small number of minor stains when the clan has enough public credibility. Serious breaches remain impossible to bluff away.

The pass changes:
- dialogue wording;
- choice labels;
- outcome-preview wording;
- journey hint wording;
- display-only reduced dialogue text already owned by NarrativeDialogueAdapter;
- one new runtime judgement step, `bluff-accepted`;
- one memory flag, `alaricBluffSucceeded`, used only to prevent replaying an already accepted bluff.

## Audit findings

### 1. Repeated moral grammar

Several early and mid-game scenes shared the same readable pattern:
`people/honour` vs `resources/profit`.

The issue was not the underlying consequences but that scene framing and choice labels often exposed the moral answer before the player had to think.

### 2. Séraphine / Maelor predictability

Séraphine frequently owned the humane or sacred position while Maelor owned the profitable one. This made both advisers readable too early.

The correction is not to invert them arbitrarily, but to make both acknowledge:
- the cost of their preferred option;
- the legitimate concern in the opposing argument;
- long-term consequences beyond immediate reputation or gold.

Long-term character doctrine:
- they are not permanent moral opposites;
- they may agree when experience brings them to the same conclusion;
- they may strongly diverge when their values genuinely conflict;
- their positions must evolve with what the clan has lived through;
- later chapters should allow each adviser to surprise the player without betraying established character logic.

### 3. Hero ensemble function

Alistair remains the voice that converts debate into collective responsibility.

Kestrel remains the voice of terrain, time pressure and tactical reality.

Marian owns care, aftermath, wounds and the human cost that strategic language can obscure.

Elara owns arcane interpretation, uncertainty and the first perception of forces beyond the clan conflict.

Cedric, Garen and later recruited heroes must keep gaining dialogue ownership whenever their knowledge, origin or lived experience makes them the most natural speaker.

No hero should exist only as a combat unit once recruited. The ensemble must progressively accumulate narrative identity, while Alistair and Kestrel retain their especially strong early-route roles.

### 4. Serpent General

The General remains a secondary chapter antagonist, not a rival to Alaric.

His impact is improved through strategic intelligence:
- manipulating route markers;
- testing Cedric's information;
- creating forced choices rather than simply adding troops;
- retreating in a way that controls information.

### 5. Final judgement tone

The Alaric finale was logically strong but some dynamic lines read like an audit report.

The same facts and resolution order are retained, but phrasing now treats the route as lived history rather than a variable list.

## Major scene corrections

### Opening
Character introductions now describe why each person remained after the clan's fall instead of reading like class tutorials.

### Refugees
The negative choice now explicitly matches its effect: the clan sells route information for the refugees' last 40 gold instead of vaguely “taking information and continuing.”

### Injured merchant
The scene now emphasizes mission urgency versus leaving one injured person exposed on the road.

### Abandoned cart
Ownership remains visible in the language. Taking the cargo is no longer framed as anonymous loot.

### Reserve trail
The existing strategic dilemma is preserved, while previews no longer label Maelor as the “greed” answer.

### Shrine scenes
The choice is framed as converting a shared refuge/protection into private resources rather than simply “respect vs loot.”

### Bois-Clair
Both advisers now present defensible, costly positions:
- Séraphine acknowledges that saving captives may leave survivors without reserves or clean water;
- Maelor argues that securing reserves can protect the village's next day, not merely enrich the clan;
- Alistair explicitly states that neither choice saves everyone.

### Young dragon
Sparing the dragon is framed as a strategic decision, not automatic moral purity.

### Informant
Protection has a real tactical cost; betrayal damages the clan's future credibility with defectors.

### Shadow signs
The choice is now evidence vs safety:
- intact proof is also a dangerous beacon;
- breaking the altar reduces the signal but destroys definitive proof.

### Final refuge
The scene no longer reads as a variable checklist. Maelor accepts that his accounts cannot revise the route; Séraphine closes on the coexistence of different kinds of cost.

### Alaric judgement
The same verdict inputs remain authoritative, but the language now emphasizes people, traces, witnesses and consequences rather than “merits/stains” as abstract counters.

The deposition now exposes three explicit player postures:
- **truthful deposition**: accept the record and let Alaric judge the facts;
- **reasoned bluff**: rhetorically reframe a small number of minor stains when public credibility makes that reading plausible;
- **brazen denial**: reject the reports and witnesses outright, even when the evidence is already established.

Rules:
- a serious breach can never be erased by reputation;
- one or two minor stains may be rhetorically reframed when public credibility is strong enough;
- supportive witnesses can reinforce credibility but cannot cancel serious facts;
- a failed reasoned bluff becomes an explicit lie and sets `liedToAlaric`;
- a successful bluff sets `alaricBluffSucceeded` and receives an explicit “benefit of the doubt” response from Alaric;
- a brazen denial sets both `liedToAlaric` and `brazenLieToAlaric`, creates a decisive trust breach, and forces the Lion Trial even at very high reputation;
- the underlying historical facts remain in the verdict even when their interpretation is accepted.

## Presentation doctrine for Cinematics

Cinematics must preserve the following distinctions:

- Séraphine is not the “good choice” icon.
- Maelor is not the “greed choice” icon.
- Alistair owns responsibility and commitment once a choice is made.
- Kestrel owns urgency, terrain and tactical constraints.
- Marian owns human aftermath and care, not abstract moral judgement.
- Alaric judges facts, not a morality score.
- Witnesses remain independent agents, not reputation tokens.
- The Serpent General should feel observant and strategic, not omniscient.
- Shadow evidence must visually communicate both value and danger.

## Validation

Structural comparison before the bluff refinement confirmed unchanged campaign topology, combat references, route ownership and all existing choice consequences.

After the judgement refinement, the intentional semantic additions are:
- `alaricBluffSucceeded`;
- `brazenLieToAlaric`;
- dynamic steps `bluff-accepted` and `brazen-lie-rebuked`;
- deterministic credibility assessment for the reasoned bluff;
- decisive trust consequences for an explicit denial of established evidence.

The Final Narrative Structure Lock remains intact because no campaign route, node topology, combat route, ending route, Conduct rule, Witness rule or Shadow rule is changed.
