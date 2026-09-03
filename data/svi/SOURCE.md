# CDC Social Vulnerability Index (SVI) — REAL DATA

**File**: `maricopa_svi_2022.csv` — 1,009 Maricopa County census tracts.

**Source**: CDC/ATSDR Social Vulnerability Index 2022, census-tract layer, retrieved from the official CDC ArcGIS Feature Service (layer `SVI2022 US tract`):

https://services3.arcgis.com/ZvidGQkLaDJxRSJ2/arcgis/rest/services/CDC_ATSDR_Social_Vulnerability_Index_2022_USA/FeatureServer/2

**Fields**:
- `fips` — 11-digit census tract FIPS code
- `location` — tract description ("Census Tract 1094.01; Maricopa County; Arizona")
- `svi_rpl_themes` — **RPL_THEMES**: overall SVI percentile ranking (0.0–1.0). This is the value SHADE uses.
- `ep_pov150` — % of persons below 150% of the poverty line
- `ep_uninsur` — % uninsured
- `ep_noveh` — % of households with no vehicle
- `ep_age65` — % of persons aged 65+
- `centroid_lat`, `centroid_lon` — tract centroid (converted from Web Mercator to WGS-84), used for the nearest-centroid spatial lookup

**Verification** (nearest tract centroid to the district centers used in SHADE):
| District | Nearest tract | Real SVI (RPL_THEMES) |
|---|---|---|
| Maryvale (33.4942, -112.1771) | 04013109401 | **0.9398** |
| Arcadia (33.4980, -111.9540) | 04013108000 | **0.0116** |

**Known limitation (documented, not hidden)**: the lookup is nearest-tract-*centroid*,
not an exact point-in-polygon join. At tract boundaries the returned tract can be off
by one tract. This is an approximation applied to real data, and the API marks it as
`lookup_method: "nearest_centroid"`.
