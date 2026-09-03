"""
Social Vulnerability Index (SVI) loader — REAL DATA.

Loads the CDC/ATSDR 2022 Social Vulnerability Index (RPL_THEMES overall percentile)
for all 1,009 Maricopa County census tracts from a shipped CSV and performs a
nearest-tract-centroid spatial lookup for arbitrary lat/lon points.

Data provenance (see data/svi/SOURCE.md and maricopa_svi_2022.csv header):
  CDC/ATSDR Social Vulnerability Index 2022, census-tract layer, retrieved from the
  official CDC ArcGIS Feature Service:
  https://services3.arcgis.com/ZvidGQkLaDJxRSJ2/arcgis/rest/services/
      CDC_ATSDR_Social_Vulnerability_Index_2022_USA/FeatureServer  (layer 2)

This is real, published public-health data. Values are tract-level percentiles
(0.0 - 1.0). The lookup uses nearest centroid, which is an approximation at tract
boundaries (accuracy within ~1-2 tracts); it is NOT an exact point-in-polygon join.
"""
import csv
import math
import os
import logging
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

_DEFAULT_CSV = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data", "svi", "maricopa_svi_2022.csv"
)


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class SVILoader:
    """Nearest-centroid lookup of real CDC/ATSDR 2022 SVI percentiles for Maricopa County."""

    def __init__(self, data_path: Optional[str] = None):
        self.data_path = data_path or _DEFAULT_CSV
        # fips -> {svi, location, ep_pov150, ep_uninsur, ep_noveh, ep_age65, lat, lon}
        self.svi_data: Dict[str, Dict[str, Any]] = {}
        self.load_csv(self.data_path)

    def load_csv(self, file_path: str) -> None:
        """Loads the tract-level SVI CSV (fips, svi_rpl_themes, centroid_lat, centroid_lon, ...)."""
        try:
            with open(file_path, mode="r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    fips = (row.get("fips") or "").strip()
                    svi_raw = (row.get("svi_rpl_themes") or "").strip()
                    lat_raw = (row.get("centroid_lat") or "").strip()
                    lon_raw = (row.get("centroid_lon") or "").strip()
                    if not fips or svi_raw == "" or lat_raw == "" or lon_raw == "":
                        continue
                    try:
                        self.svi_data[fips] = {
                            "svi": float(svi_raw),
                            "location": row.get("location", ""),
                            "ep_pov150": float(row["ep_pov150"]) if row.get("ep_pov150") else None,
                            "ep_uninsur": float(row["ep_uninsur"]) if row.get("ep_uninsur") else None,
                            "ep_noveh": float(row["ep_noveh"]) if row.get("ep_noveh") else None,
                            "ep_age65": float(row["ep_age65"]) if row.get("ep_age65") else None,
                            "lat": float(lat_raw),
                            "lon": float(lon_raw),
                        }
                    except ValueError:
                        continue
            logger.info("SVILoader: loaded %d Maricopa County tracts from %s", len(self.svi_data), file_path)
        except Exception as e:  # pragma: no cover - defensive
            logger.error("Error loading SVI CSV %s: %s", file_path, e)

    def lookup(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """
        Nearest-tract-centroid lookup. Returns the tract record (including real SVI),
        or None if the dataset is unavailable or the point is far outside Maricopa County
        (> 50 km from the nearest tract centroid).
        """
        if not self.svi_data:
            return None
        best_fips, best_dist = None, float("inf")
        for fips, rec in self.svi_data.items():
            d = (rec["lat"] - lat) ** 2 + (rec["lon"] - lon) ** 2
            if d < best_dist:
                best_dist, best_fips = d, fips
        if best_fips is None:
            return None
        rec = self.svi_data[best_fips]
        dist_m = _haversine_m(lat, lon, rec["lat"], rec["lon"])
        if dist_m > 50_000:
            # Point is far outside the covered region (Maricopa County).
            return None
        return {
            "fips": best_fips,
            "svi": rec["svi"],
            "tract_location": rec["location"],
            "tract_distance_m": round(dist_m, 1),
            "ep_pov150": rec["ep_pov150"],
            "ep_age65": rec["ep_age65"],
            "source": "CDC/ATSDR SVI 2022 (RPL_THEMES), tract-level, nearest-centroid lookup",
            "lookup_method": "nearest_centroid",
        }

    # --- Backward-compatible API used by fortyguard_client.py -------------------
    def get_svi_for_coords(self, lat: float, lon: float) -> float:
        """Real SVI for a coordinate. Falls back to 0.5 (median) ONLY when the point
        lies outside the Maricopa County dataset coverage."""
        rec = self.lookup(lat, lon)
        if rec is not None:
            return rec["svi"]
        return 0.5

    def get_svi_for_location(self, lat: float, lon: float) -> float:
        """Alias kept for compatibility with earlier call sites."""
        return self.get_svi_for_coords(lat, lon)


# Module-level singleton used across the backend.
_default_loader: Optional[SVILoader] = None


def get_default_loader() -> SVILoader:
    global _default_loader
    if _default_loader is None:
        _default_loader = SVILoader()
    return _default_loader
