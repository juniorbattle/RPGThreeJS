# Tactical Combat, Combat Stage and VFX

Status: **LOCKED**.

The tactical combat runtime owns turn order, action legality, AP, status application, damage, defeat, and encounter outcome. `CombatBridge` and existing campaign handoffs connect canonical combat nodes to the run. A presentation surface may observe or animate resolved events; it must not re-resolve them or change campaign truth.

Combat Stage is presentation-only. It stages canonical actors and actions and reports completion/lifecycle, but never owns a second damage/AP/status/outcome model. Preserve Character System V2 pose identities and authored combat framing. Files with historical or `legacy` names can still be production owners; inspect references before removal.

VFX are presentation-only and cannot alter an action result. Their final authored catalog is incomplete. Finish it through scoped asset, registry, visibility, timing, and reduced-motion checks tied to real resolved events. A missing effect may be documented as a production gap; it does not authorize a fabricated gameplay effect or an unrelated asset substitution.
