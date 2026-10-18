# Tactical Combat, Combat Stage and VFX

Status: **LOCKED**.

## Lot E independent encounter context — OD-2026-10-15-B

Dedicated `PRODUCTION-CONTRACTS-POI-LOT-E-1`, set 1.4.0, [approved catalogue](../autonomy/LOT_E_OPERATOR_DECISION_2026-10-15.md). Author twelve ordinary variant configs and two elite configs with distinct Lot E combat IDs, valid existing units/poses/scenes and exact fixed rewards. Reuse formations, never contextual canonical scripts, boss/finale hooks or their completion facts. Stable per-run/POI selection changes the formation only. The annex's elite formations use existing tactical rules/stats and explicit deployment authoring; measure calibration without changing global enemy stats or canonical rewards.

Mobile combat carries a durable independent elite encounter identity and safe return, not the occupied RunNode's resolution context. Tactical Combat/CombatBridge still decide real outcomes. Elite victory applies combat progress and that elite's one-time immediately usable rewards and defeated fact atomically, without resolving/activating the underlying POI or triggering its narrative/finale hooks. Both ordinary and elite defeat restore the last valid actual save belonging to the selected game (run identity, including valid pending finale contexts), never a synthesized checkpoint state or unrelated save. Loading alone must not settle pending arrival content, clear a saved encounter or overwrite good reference bytes. Saved pending combat resumes through existing explicit continuation agency; missing/corrupt recovery preserves safe player agency and existing saves, never claims the defeated live state or a fabricated new game as restoration. Defeat itself grants no reward or elite defeat fact. Reload, duplicate input/result and interrupted presentation cannot repeat attribution. Combat Stage/VFX acquire no new truth authority.

The tactical combat runtime owns turn order, action legality, AP, status application, damage, defeat, and encounter outcome. `CombatBridge` and existing campaign handoffs connect canonical combat nodes to the run. A presentation surface may observe or animate resolved events; it must not re-resolve them or change campaign truth.

Combat Stage is presentation-only. It stages canonical actors and actions and reports completion/lifecycle, but never owns a second damage/AP/status/outcome model. Preserve Character System V2 pose identities and authored combat framing. Files with historical or `legacy` names can still be production owners; inspect references before removal.

VFX are presentation-only and cannot alter an action result. Their final authored catalog is incomplete. Finish it through scoped asset, registry, visibility, timing, and reduced-motion checks tied to real resolved events. A missing effect may be documented as a production gap; it does not authorize a fabricated gameplay effect or an unrelated asset substitution.
