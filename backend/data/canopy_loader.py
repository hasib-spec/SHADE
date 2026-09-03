"""
Urban Tree Canopy loader — REAL, SOURCED DISTRICT ANCHORS.

Loads City of Phoenix published tree-canopy figures (data/canopy/phoenix_district_canopy.csv)
and serves canopy-cover fractions for coordinates inside the two pilot districts.

What is REAL here, exactly:
  - Maryvale canopy (7.7%) is a City of Phoenix published neighborhood figure.
  - Phoenix citywide median (11%) and tract range (2%-30.4%) are city-published.
  - Arcadia (25%) is a clearly-labeled conservative ESTIMATE: the city ranks Arcadia
    among its highest-canopy neighborhoods (max observed tract = 30.4%) but does not
    publish an exact district figure. Any output derived from the Arcadia value is a
    modeled estimate and the API marks it as such ("verified": false).

Out-of-district / global coordinates return None from `lookup()`; callers must label
their canopy values as modeled baselines in that case.
"""
import csv
import os
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

_DEFAULT_CSV = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data", "canopy", "phoenix_district_canopy.csv"
)

# Bounding boxes (min_lat, max_lat, min_lon, max_lon) for the pilot districts.
DISTRICT_BOXES: Dict[str, Dict[str, Any]] = {
    "maryvale": {
        "bbox": (33.480, 33.510, -112.200, -112.160),
        "area_key": "Maryvale (Census Tract 1094.01 area)",
    },
    "arcadia": {
        "bbox": (33.480, 33.515, -111.975, -111.930),
        "area_key": "Arcadia (Census Tract 1080 area)",
    },
}


class CanopyLoader:
    """Serves real, sourced City of Phoenix canopy anchors for the pilot districts."""

    def __init__(self, data_path: Optional[str] = None):
        self.data_path = data_path or _DEFAULT_CSV
        self.canopy_data: Dict[str, Dict[str, Any]] = {}
        self.load_csv(self.data_path)

    def load_csv(self, file_path: str) -> None:
        try:
            with open(file_path, mode="r", encoding="utf-8") as f:
                for row in csv.DictReader(f):
                    area = (row.get("area_name") or "").strip()
                    val = (row.get("canopy_fraction") or "").strip()
                    if not area or val == "":
                        continue
                    try:
                        self.canopy_data[area] = {
                            "canopy_fraction": float(val),
                            "canopy_pct": float(row.get("canopy_pct", 0) or 0),
                            "source": (row.get("source") or "").strip(),
                            "verified": (row.get("verified", "no") or "no").strip().lower() == "yes",
                        }
                    except ValueError:
                        continue
            logger.info("CanopyLoader: loaded %d canopy anchors from %s", len(self.canopy_data), file_path)
        except Exception as e:  # pragma: no cover - defensive
            logger.error("Error loading canopy CSV %s: %s", file_path, e)

    def lookup(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """Return the sourced canopy record for a point inside a pilot district, else None."""
        for name, meta in DISTRICT_BOXES.items():
            min_lat, max_lat, min_lon, max_lon = meta["bbox"]
            if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
                rec = self.canopy_data.get(meta["area_key"])
                if rec is not None:
                    out = dict(rec)
                    out["district"] = name
                    return out
        return None

    # --- Backward-compatible API used by fortyguard_client.py -------------------
    def get_canopy_for_coords(self, lat: float, lon: float) -> Optional[float]:
        """Real/sourced canopy fraction for pilot-district coordinates; None elsewhere.
        Returning None (instead of a fake constant) forces callers to fall back to a
        clearly-labeled modeled baseline."""
        rec = self.lookup(lat, lon)
        if rec is not None:
            return rec["canopy_fraction"]
        return None

    def get_canopy_for_location(self, lat: float, lon: float) -> Optional[float]:
        """Alias kept for compatibility with earlier call sites."""
        return self.get_canopy_for_coords(lat, lon)

    def district_anchor(self, district: str) -> Optional[Dict[str, Any]]:
        """Get the sourced canopy anchor record for a named pilot district."""
        meta = DISTRICT_BOXES.get((district or "").lower().strip())
        if not meta:
            return None
        rec = self.canopy_data.get(meta["area_key"])
        if rec is None:
            return None
        out = dict(rec)
        out["district"] = meta["area_key"]
        return out

    def citywide_stats(self) -> Dict[str, Any]:
        """Real city-published canopy statistics for documentation/UI."""
        median = self.canopy_data.get("Phoenix citywide median tract")
        lo = self.canopy_data.get("Phoenix tract-level range (low)")
        hi = self.canopy_data.get("Phoenix tract-level range (high)")
        return {
            "median_tract_fraction": median["canopy_fraction"] if median else None,
            "min_tract_fraction": lo["canopy_fraction"] if lo else None,
            "max_tract_fraction": hi["canopy_fraction"] if hi else None,
            "source": median["source"] if median else "City of Phoenix Tree and Shade Master Plan",
        }


# Module-level singleton used across the backend.
_default_loader: Optional[CanopyLoader] = None


def get_default_loader() -> CanopyLoader:
    global _default_loader
    if _default_loader is None:
        _default_loader = CanopyLoader()
    return _default_loader
