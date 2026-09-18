# DRAFT — Judgement & Accusation Doctrine

> **Status:** FUTURE DESIGN / NON-CANONICAL  
> **Scope:** post-Lion chapters, future clan chiefs, future Seals, social confrontations and accusation-driven dialogue  
> **Do not implement automatically in the Lion demo.**  
> This document preserves design intent for future narrative work. Any production implementation must receive its own narrative/technical audit and explicit lock.

## Purpose

The Lion chapter introduces the first version of a judgement system through Alaric:
- real actions;
- witnesses;
- reputation;
- Conduct;
- Shadow knowledge/disclosure;
- truthful deposition;
- reasoned bluff;
- reckless denial.

Future chiefs must not simply repeat Alaric with different names.

The long-term goal is a richer **social-confrontation system** in which the game distinguishes:

```text
WHAT ACTUALLY HAPPENED
        !=
WHAT THE AUTHORITY KNOWS
        !=
WHAT THE AUTHORITY BELIEVES
        !=
WHAT THE CLAN IS ACCUSED OF
        !=
WHAT EVIDENCE EXISTS
        !=
WHAT THE PLAYER CHOOSES TO SAY
```

The game should judge the relationship between these layers rather than treating every accusation as truth.

---

## Core Truth Layers

Every major future accusation should be conceptually decomposable into the following layers.

### 1. Objective Fact

What actually happened in the authoritative game state.

Examples:
- the clan burned a convoy;
- the clan did not burn a convoy;
- the clan arrived after the attack;
- a companion acted independently;
- the truth is genuinely incomplete.

Possible truth states:

```text
TRUE
FALSE
PARTIALLY_TRUE
AMBIGUOUS
UNKNOWN
```

### 2. Authority Knowledge

What the chief or judge actually knows.

Examples:
- has direct proof;
- knows the accusation is false;
- has incomplete reports;
- has been deceived;
- suspects the truth but cannot prove it.

This must remain distinct from what the authority says publicly.

### 3. Authority Belief

What the authority currently believes to be true.

A chief can:
- know the truth;
- sincerely believe a false report;
- remain uncertain;
- deliberately pretend to believe something false.

### 4. Public Accusation

What is said to the clan.

The accusation may be:
- accurate;
- partially accurate;
- exaggerated;
- mistaken;
- politically framed;
- deliberately fabricated.

### 5. Evidence State

Evidence should have both **strength** and **provenance**.

Potential strength:

```text
NONE
RUMOUR
CIRCUMSTANTIAL
CORROBORATED
DIRECT
OVERWHELMING
```

Potential provenance:
- witnesses;
- physical evidence;
- records;
- magical evidence;
- companion testimony;
- enemy testimony;
- forged evidence;
- compromised evidence.

### 6. Authority Intent

Why the accusation is being presented.

Examples:

```text
SEEK_TRUTH
TEST_CHARACTER
POLITICAL_PRESSURE
FORCE_CONFESSION
PROVOKE
NEGOTIATE
HUMILIATE
JUSTIFY_PREMADE_DECISION
EXPOSE_LIE
PROTECT_THIRD_PARTY
```

This allows a chief to knowingly make a false accusation as a test.

### 7. Player Response

Future social confrontations should not collapse into only "truth" versus "lie".

Potential response families:

```text
ADMIT
ACCEPT_RESPONSIBILITY
EXPLAIN
REFRAME
BLUFF
DENY
CHALLENGE_EVIDENCE
PRESENT_EVIDENCE
CALL_WITNESS
COUNTER_ACCUSE
REMAIN_SILENT
ACCEPT_FALSE_BLAME
DEFLECT
THREATEN
APPEAL_TO_REPUTATION
APPEAL_TO_RELATIONSHIP
```

The meaning of a response depends on objective truth.

---

## Truthful Denial Is Not Lying

A central doctrine:

> **The dialogue engine must never assume that DENY = LIE.**

If the clan did not commit the accused act, denial can be:
- truthful;
- courageous;
- diplomatically risky;
- strategically correct;
- poorly expressed;
- strongly supported by evidence.

Example:

```text
ACCUSATION:
"Your clan burned our border post."

OBJECTIVE FACT:
FALSE

PLAYER:
"No. We were already beyond the eastern pass."

RESULT:
truthful denial
```

This must not create a lying flag.

---

## False Accusations as Character Tests

A future chief may knowingly accuse the clan of something it did not do.

Purpose:

```text
TEST_CHARACTER
```

The chief may be observing:
- whether the player knows the clan's own actions;
- whether the player submits to authority automatically;
- whether the player invents evidence;
- whether the player protects subordinates;
- whether the player can remain composed under injustice.

Example:

```text
CHIEF:
"Your company looted my southern convoy."

REALITY:
the clan never encountered it

CHIEF KNOWS:
the clan is innocent

INTENT:
test
```

Possible responses:

### Firm truthful denial
```text
"We did not. Your own patrol logs can prove where we were."
```

Potential outcome:
- respect increases;
- chief reveals it was a test.

### Accept false blame
```text
"If that is what you heard, we will answer for it."
```

Potential outcome:
- chief loses respect;
- the clan appears willing to confess to anything for political convenience.

### Invent a counter-story
```text
"The Serpents did it."
```

If unsupported:
- the initial accusation was false;
- but the player's defence becomes dishonest.

Important:

```text
FALSE ACCUSATION
+
FALSE COUNTERCLAIM
!=
TRUTHFUL DEFENCE
```

---

## Sincere but Mistaken Authority

A chief can also genuinely believe a false accusation.

This creates a different dramatic problem.

The player may need to:
- present chronology;
- produce physical evidence;
- call a witness;
- rely on a recruited hero's expertise;
- request an investigation;
- defend the truth without humiliating the chief.

A factually correct response can still be diplomatically disastrous.

Example:

```text
"You are a fool if you believe that report."
```

may be:

```text
TRUTHFUL = YES
DIPLOMATIC = NO
```

Truthfulness and diplomacy must remain separate dimensions.

---

## True Accusation, Weak Evidence

This is the space introduced by the Lion chapter's Alaric bluff.

Example:

```text
OBJECTIVE FACT:
TRUE

AUTHORITY EVIDENCE:
WEAK

PLAYER REPUTATION:
HIGH

PLAYER RESPONSE:
REFRAME / BLUFF
```

The player may plausibly:
- minimize an ambiguous act;
- provide a favourable interpretation;
- exploit uncertainty;
- use reputation as credibility.

This must differ from denying overwhelming evidence.

---

## True Accusation, Overwhelming Evidence

Example:

```text
OBJECTIVE FACT:
TRUE

EVIDENCE:
OVERWHELMING

WITNESSES:
MULTIPLE

PLAYER:
"Everything is false."
```

This is a **brazen lie**.

The Lion chapter now establishes the first version of this rule:

```text
brazenLieToAlaric
→ decisive trust breach
→ recognition impossible
→ Lion Trial
```

Future chiefs may react differently, but the semantic distinction should remain.

---

## Reputation Doctrine

Reputation must remain:

> **social credibility, not a reality-editing stat.**

High reputation may:
- make an ambiguous explanation believable;
- make witnesses initially trust the clan;
- earn the player time to explain;
- persuade an authority to investigate further;
- make a bluff plausible when evidence is weak.

High reputation must **not**:
- erase decisive evidence;
- rewrite objective facts;
- automatically defeat truthful witnesses;
- turn every lie into success.

Conceptually:

```text
REPUTATION
= BENEFIT OF THE DOUBT

REPUTATION
!= RETROACTIVE TRUTH
```

---

## Witness Doctrine

Witnesses must remain autonomous people, not reputation tokens.

They can:
- support the clan;
- oppose the clan;
- tell a mixed story;
- remember different parts of an event;
- misunderstand something honestly;
- lie for their own reasons;
- be intimidated;
- be missing;
- contradict each other.

A "supportive witness" should not automatically mean:
> "everything the player says becomes true."

Witness credibility should depend on:
- what they actually observed;
- their relationship to the clan;
- whether their testimony is corroborated;
- possible motives.

---

## Companion Testimony

Recruited heroes should increasingly become **narrative evidence sources**, not only combat units.

Examples:

### Kestrel
Best suited for:
- route chronology;
- terrain;
- enemy movement;
- scouting observations;
- confirming where the company physically was.

### Alistair
Best suited for:
- command decisions;
- responsibility;
- orders issued;
- admitting or defending collective action.

### Marian
Best suited for:
- wounds;
- casualties;
- medical timing;
- human aftermath;
- identifying whether an event happened before or after the clan arrived.

### Elara
Best suited for:
- magical residue;
- Shadow phenomena;
- arcane evidence;
- distinguishing ordinary combat from supernatural interference.

### Cedric
Best suited for:
- Serpent procedures;
- old routes;
- enemy signals;
- interpreting Serpent-origin evidence.

### Garen
Best suited for:
- Bois-Clair/local testimony;
- militia knowledge;
- civilian perspective;
- how outsiders perceive the clan.

Future recruits should gain similar narrative ownership according to origin and expertise.

Doctrine:

> **A recruited hero must progressively become a witness, expert, relationship or perspective — never remain only a combat unit.**

---

## Adviser Doctrine

Séraphine and Maelor should not become permanent GOOD/BAD poles.

They may:

```text
AGREE
DISAGREE
PARTIALLY_AGREE
CHANGE_POSITION
SUPPORT_THE_SAME_ACTION_FOR_DIFFERENT_REASONS
```

### Séraphine

Broad concerns:
- truth;
- legacy;
- promises;
- cultural continuity;
- human dignity;
- long-term moral identity.

But she may support pragmatic withdrawal, secrecy or compromise when those actions best protect those values.

### Maelor

Broad concerns:
- survival;
- resources;
- political leverage;
- institutional continuity;
- long-term optionality.

But he may defend civilians, truth or restraint when exploitation would damage the clan's future credibility or strategic position.

Their evolution should emerge from what the clan has lived through.

---

## Chief-Specific Judgement Grammar

Future chiefs should not all use Alaric's moral grammar.

### Alaric — Responsibility

Core question:

> **Can this clan be trusted with power after what it chose to do?**

Tools:
- witnesses;
- concrete conduct;
- responsibility;
- truth/bluff/lie.

### Possible Future Chief — Intelligence

Core question:

> **Can this clan detect manipulation and think independently?**

Tools:
- deliberate falsehoods;
- contradictory evidence;
- traps;
- information asymmetry.

### Possible Future Chief — Political Legitimacy

Core question:

> **Will this clan protect truth even when public stability demands a convenient story?**

Tools:
- false public confession;
- secret truth;
- alliance costs;
- reputation.

### Possible Future Chief — Paranoia

Core question:

> **Can the clan prove innocence to someone who sincerely expects betrayal?**

Tools:
- evidence chains;
- witnesses;
- patience;
- insult risk.

### Possible Future Chief — Manipulation

Core question:

> **Can the clan recognize that both offered narratives are incomplete?**

Tools:
- partial truths;
- forced binaries;
- counter-questions;
- silence.

Each Seal should therefore have a distinct **social grammar**, just as each clan should have its own culture.

---

## Social Confrontation as a System

Long-term, major judgements can be thought of as lightweight social combat.

Not with a new morality meter.

Instead:

```text
FACTS
+ EVIDENCE
+ WITNESSES
+ REPUTATION
+ RELATIONSHIPS
+ AUTHORITY PERSONALITY
+ PLAYER RESPONSE
=
SOCIAL OUTCOME
```

Potential outcomes:
- belief;
- doubt;
- respect;
- distrust;
- investigation;
- concession;
- political debt;
- forced trial;
- alliance;
- public humiliation;
- hidden respect despite public disagreement.

---

## Important Anti-Patterns

Avoid:

### 1. Accusation = truth
The game must not assume the chief is always correct.

### 2. Denial = lie
Truthful denial must remain possible.

### 3. Reputation = mind control
High reputation cannot invalidate evidence.

### 4. Every chief = Alaric
Future leaders need different values and testing methods.

### 5. Adviser = answer key
Séraphine and Maelor must not reveal the designer's preferred answer.

### 6. Companion = decorative interjection
A companion should speak because their knowledge or emotional stake matters.

### 7. Fake complexity
Do not create ten dialogue options that resolve identically.

### 8. Arbitrary hidden tests
If a chief tests the player, later revelation must make the test logically reconstructable.

---

## Suggested Future Data Model — Draft Only

Do **not** implement this schema without a dedicated system-design pass.

Conceptual example:

```ts
interface AccusationCase {
  id: string;

  objectiveTruth: 'true' | 'false' | 'partial' | 'ambiguous' | 'unknown';

  authorityKnowledge:
    | 'knows_truth'
    | 'knows_false'
    | 'uncertain'
    | 'misinformed';

  authorityBelief:
    | 'believes_true'
    | 'believes_false'
    | 'uncertain';

  authorityIntent:
    | 'seek_truth'
    | 'test_character'
    | 'political_pressure'
    | 'provoke'
    | 'force_confession'
    | 'manipulate';

  evidence: EvidenceRecord[];
  eligibleWitnesses: string[];
  eligibleCompanionExperts: string[];
}
```

Response resolution should compare:
- response semantic intent;
- objective truth;
- known evidence;
- player-held evidence;
- reputation;
- relationships;
- prior credibility;
- authority personality.

---

## Example Resolution Matrix

| Objective truth | Evidence | Player response | Possible interpretation |
|---|---|---|---|
| False | weak | Deny | Truthful defence |
| False | strong but forged | Deny + proof | Vindication |
| False | none | Accept blame | Political submission / weak self-knowledge |
| False | none | Invent accusation | Dishonest defence |
| True | weak | Reframe | Plausible bluff |
| True | weak | Deny | Risky lie |
| True | overwhelming | Deny | Brazen lie |
| Partial | mixed | Explain | Nuanced truth |
| Ambiguous | conflicting | Remain silent | Strategic restraint or suspicious evasion |
| Any | any | Present companion witness | Depends on witness relevance and credibility |

---

## Relation to the Lion Demo

The Lion chapter should remain the **Level 1 implementation** of this broader concept.

Current Lion grammar:

```text
REAL FACTS
+ WITNESSES
+ REPUTATION
+ CONDUCT
+ SHADOW STATE
+ TRUTH / REASONED BLUFF / BRAZEN DENIAL
→ ALARIC VERDICT
```

Do not expand the Lion demo into the full future system unless a later audit finds a concrete need.

Its role is to establish the language that later chapters can deepen.

---

## Future Work Checklist

When beginning the next major chief / Seal dialogue phase:

1. Re-read this draft.
2. Define the chief's unique social grammar.
3. Define what the chief knows versus believes.
4. List every accusation and its objective truth.
5. Define evidence and witness provenance.
6. Identify which recruited heroes can speak as experts.
7. Define adviser positions without making either an answer key.
8. Define truthful denial, bluff, lie and silence semantics.
9. Define what reputation can and cannot influence.
10. Write deterministic resolution rules before writing dialogue prose.
11. Create contradiction tests.
12. Create save/reload tests for accusation state.
13. Create presentation variants only after logic is locked.
14. Promote this draft into a formal system design only when implementation begins.

---

## Design Principle to Preserve

> **The game should judge the coherence between what the clan did, what others can know, what the player claims, and why the player chooses to claim it.**

The interesting question is not merely:

> "Did the player choose the good dialogue option?"

It is:

> **"Does the player's story survive contact with truth, evidence, witnesses, politics and the personality of the person judging them?"**
