# Urban Tree Canopy — SOURCED DISTRICT ANCHORS

**File**: `phoenix_district_canopy.csv`

**What is real vs. estimated** (also marked per-row in the `verified` column):

| Area | Canopy | Status | Source |
|---|---|---|---|
| Maryvale | **7.7%** | Verified | City of Phoenix neighborhood canopy data (reported by AZ Family/3TV, Aug 2026); City of Phoenix Tree and Shade Master Plan |
| Phoenix citywide median tract | **11%** | Verified | City of Phoenix "SHADE PHOENIX" story map / 2025 Tree and Shade Master Plan update |
| Phoenix tract range | **2% – 30.4%** | Verified | Same master plan update ("tract canopy varies from 2% to 30%; most-canopied neighborhood 30.4%") |
| Arcadia | **25%** | **Estimate** | Arcadia & Encanto are ranked by the city among its highest-canopy neighborhoods, but an exact district figure is not published. 25% is a conservative top-tier estimate, deliberately below the city's observed 30.4% maximum. |

**Reference**: https://storymaps.arcgis.com/stories/fc03d8a6a86e4f998169205dc8705e56

**Known limitation (documented, not hidden)**: canopy is anchored at the district level,
not the 20 m² cell level. Cell-level canopy variation inside a district is modeled by
SHADE's microclimate baseline (clearly labeled `data_provenance: "modeled"`), not
measured per cell. An NLCD Tree Canopy raster join is on the roadmap for exact
per-cell values.

## Mesh-level canopy representation (modeled, documented)

The microclimate mesh keeps the **non-corridor baseline at the sourced anchor**
(Maryvale non-corridor cells average ≈ 7% canopy, matching the city-published
7.7%) and adds one **modeled canal-trail corridor** whose core runs at 0.76–0.85
canopy, reflecting the mature shade-tree plantings along Phoenix canal paths
(SRP / Tree and Shade Master Plan corridors). Including the strip, the mesh-mean
canopy is ≈ 13%. The strip exists so that cool-route A* pathfinding has a
realistic shaded corridor to route through; it is labeled
`data_provenance: "modeled"` like every other modeled field, and its profile is
a logistic step (plateau core, sharp shade line) per MaRTy transect measurements
(Middel et al., ASU) showing MRT stepping 20°C+ within one canopy width.
