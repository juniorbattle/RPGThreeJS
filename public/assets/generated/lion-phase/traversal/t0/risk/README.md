# T0 Route risk production art

Six transparent, single-lane obstacle sprites are used by `TraversalRouteRiskRenderer`.
The renderer selects a stable A/B variant by hazard ID. Two authored Route 3/4
roadblock hazards display the boulder family without changing their gameplay kind.
Route Risk is enabled by default in production and development T0 Traversal.
Only development builds accept `?traversalRisk=0` as a QA override.
