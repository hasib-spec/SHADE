import math
import uuid
import hashlib
import random
from typing import List, Dict, Any, Optional

DATA_PROVENANCE = "modeled"  # every cell carries this label — see README "Data Provenance"

# Deterministic land-use microclimate anomalies. Within-neighborhood variation of
# 3-5°C between asphalt corridors and vegetated cool islands is well documented in
# urban-climate literature and is the entire premise of hyperlocal heat mapping.
# These Gaussian features give the mesh a realistic, ROUTEABLE heat structure
# (without them the A* cool-route would have almost nothing to detour around).
# NOTE: locations/magnitudes are modeled illustrations, not surveyed features.
LAND_USE_FEATURES: Dict[str, List[Dict[str, Any]]] = {
    # Feature coordinates MUST sit inside the 400m×400m mesh extent
    # (Maryvale mesh spans lat 33.4933-33.4951, lon -112.1792..-112.1749).
    "maryvale": [
        {"lat": 33.4939, "lon": -112.1775, "radius_lat_m": 55, "radius_lon_m": 55, "delta": 2.8, "feature": "major arterial asphalt corridor (modeled)"},
        {"lat": 33.4948, "lon": -112.1785, "radius_lat_m": 45, "radius_lon_m": 45, "delta": 2.2, "feature": "large commercial parking lot (modeled)"},
        {"lat": 33.4946, "lon": -112.1768, "radius_lat_m": 50, "radius_lon_m": 50, "delta": -5.0, "canopy_boost": 0.45, "feature": "school park cool island (modeled)"},
        # Elongated irrigated canal corridor through the mesh center (canal paths with
        # vegetation run 5-8°C cooler than adjacent asphalt — the cool corridor A* can ride).
        # canopy_boost 0.72: Phoenix canal trails carry mature shade-tree plantings
        # (SRP / Tree and Shade Master Plan corridors) with canopy well above the
        # citywide median — 0.72 + district baseline ≈ 0.75-0.85 at the corridor core.
        {"lat": 33.4942, "lon": -112.1770, "radius_lat_m": 190, "radius_lon_m": 42, "delta": -7.5, "canopy_boost": 0.72, "feature": "irrigated canal path cool corridor (modeled)"},
    ],
    "arcadia": [
        {"lat": 33.4975, "lon": -111.9546, "radius_lat_m": 55, "radius_lon_m": 55, "delta": 2.0, "feature": "commercial strip asphalt (modeled)"},
        {"lat": 33.4986, "lon": -111.9532, "radius_lat_m": 75, "radius_lon_m": 75, "delta": -6.0, "canopy_boost": 0.55, "feature": "irrigated orchard/park cool island (modeled)"},
    ],
}


def _land_use_delta(district_name: str, lat: float, lon: float) -> float:
    """Total Gaussian land-use temperature delta at a point (°C)."""
    total = 0.0
    for f in LAND_USE_FEATURES.get(district_name.lower(), []):
        r_lat = f.get("radius_lat_m", f.get("radius_m", 60))
        r_lon = f.get("radius_lon_m", f.get("radius_m", 60))
        dy = (lat - f["lat"]) * 111320.0
        dx = (lon - f["lon"]) * 111320.0 * math.cos(math.radians(f["lat"]))
        d2 = (dx / r_lon) ** 2 + (dy / r_lat) ** 2
        total += f["delta"] * math.exp(-d2 / 2.0)
    return total


def _land_use_canopy_delta(district_name: str, lat: float, lon: float) -> float:
    """Vegetation accompanies cool features and is absent over hot asphalt.
    Cool features carry an explicit canopy_boost (mature park/canal-trail tree
    canopies in Phoenix run 0.45-0.85; hot asphalt strips vegetation).

    PROFILE: canopy follows a LOGISTIC STEP in normalized feature radius —
    full canopy plateau out to ~0.75 of the feature radius, then a sharp edge
    over ~0.1 radius. Tree shade really is a step function to a pedestrian:
    MaRTy transects (Middel et al., ASU) show MRT stepping 20°C+ within one
    canopy width at the shade line, while air temperature smooths over tens of
    meters (hence the plain-Gaussian air field below). District baseline stays
    at the sourced anchor (Maryvale ≈ 7.7%), so only the strip is shaded."""
    total = 0.0
    for f in LAND_USE_FEATURES.get(district_name.lower(), []):
        r_lat = f.get("radius_lat_m", f.get("radius_m", 60))
        r_lon = f.get("radius_lon_m", f.get("radius_m", 60))
        dy = (lat - f["lat"]) * 111320.0
        dx = (lon - f["lon"]) * 111320.0 * math.cos(math.radians(f["lat"]))
        d2 = (dx / r_lon) ** 2 + (dy / r_lat) ** 2
        if f["delta"] < 0:
            boost = f.get("canopy_boost", min(0.45, abs(f["delta"]) / 10.0 + 0.15))
            r_norm = math.sqrt(d2)
            weight = 1.0 / (1.0 + math.exp((r_norm - 0.75) / 0.10))  # plateau + sharp shade line
            total += boost * weight
        else:
            weight = math.exp(-d2 / 2.0)
            total += -min(0.06, f["delta"] / 40.0) * weight
    return total


def _land_use_label(district_name: str, lat: float, lon: float) -> Optional[str]:
    """Strongest land-use feature label at a point (|delta| > 1°C), else None."""
    best = None
    best_mag = 1.0
    for f in LAND_USE_FEATURES.get(district_name.lower(), []):
        r_lat = f.get("radius_lat_m", f.get("radius_m", 60))
        r_lon = f.get("radius_lon_m", f.get("radius_m", 60))
        dy = (lat - f["lat"]) * 111320.0
        dx = (lon - f["lon"]) * 111320.0 * math.cos(math.radians(f["lat"]))
        d2 = (dx / r_lon) ** 2 + (dy / r_lat) ** 2
        contribution = f["delta"] * math.exp(-d2 / 2.0)
        if abs(contribution) > best_mag:
            best_mag = abs(contribution)
            best = f["feature"]
    return best

def _deterministic_seed(district_name: str) -> int:
    """Stable seed across processes (hash() is salted per-run and would make every
    server restart produce different numbers — unacceptable for reproducibility)."""
    return int(hashlib.md5(district_name.lower().strip().encode("utf-8")).hexdigest()[:8], 16)

def generate_synthetic_grid(district_name: str, hour: float = 15.0) -> List[Dict[str, Any]]:
    """
    Generates a DETERMINISTIC, physics-modeled microclimate baseline grid of
    20m x 20m cells for specific Phoenix districts.

    IMPORTANT — what this is and is NOT:
    - It IS a reproducible modeled baseline: temperature is driven by diurnal solar
      physics plus sourced district anchors (real CDC SVI 2022 tract data and real
      City of Phoenix canopy figures, see data/svi/SOURCE.md and data/canopy/SOURCE.md).
    - It is NOT measured 20m² temperature data. FortyGuard production API keys were
      not available during the hackathon window, so this baseline is used as the
      stand-in and every cell is labeled data_provenance="modeled". The API layer
      exposes this flag so no modeled number can be mistaken for a measurement.

    Districts supported:
    - "Maryvale": Low canopy, high SVI, high poverty, low albedo, higher temp.
    - "Arcadia": High canopy, low SVI, high albedo, lower temp.

    Args:
        district_name (str): The name of the district to generate.
        hour (float): Hour of the day (0-24) to simulate diurnal temperature curve.

    Returns:
        List[Dict[str, Any]]: List of generated cell dictionaries.
    """
    cells = []
    
    if district_name.lower() == "maryvale":
        center_lat = 33.4942
        center_lon = -112.1771
        canopy_range = (0.04, 0.09)   # brackets the sourced Maryvale anchor (7.7%, City of Phoenix)
        svi_range = (0.85, 0.97)      # brackets the REAL CDC SVI for tract 04013109401 = 0.9398
        albedo_base = 0.12
        base_temp_min, base_temp_max = 41.5, 44.0
        # Densities are calibrated so the 400-cell mesh sums to a plausible district
        # magnitude (Maryvale Village ≈ 40-45k residents; elderly ≈ 15%). The mesh
        # covers 0.16 km², so per-cell densities are small by construction — previously
        # they were uniform(500,5000)/cell, implying ~210,000 elderly residents in the
        # mesh and an absurd ROI. Keep densities physically plausible.
        pop_range = (60.0, 160.0)
        elderly_range = (6.0, 26.0)
        children_range = (12.0, 44.0)
        worker_range = (2.0, 14.0)
        grid_size = 20  # 20x20 = 400 cells
    elif district_name.lower() == "arcadia":
        center_lat = 33.4980
        center_lon = -111.9540
        canopy_range = (0.20, 0.30)   # brackets the sourced Arcadia anchor (0.25, city top-tier)
        svi_range = (0.01, 0.06)      # brackets the REAL CDC SVI for tract 04013108000 = 0.0116
        albedo_base = 0.28
        base_temp_min, base_temp_max = 36.0, 38.5
        pop_range = (15.0, 45.0)      # Arcadia is smaller: mesh sums to ≈ 12k residents
        elderly_range = (3.0, 12.0)
        children_range = (4.0, 16.0)
        worker_range = (1.0, 6.0)
        grid_size = 20
    else:
        # Default fallback
        center_lat = 33.45
        center_lon = -112.0
        canopy_range = (0.10, 0.20)
        svi_range = (0.4, 0.6)
        albedo_base = 0.15
        base_temp_min, base_temp_max = 40.0, 42.0
        pop_range = (30.0, 100.0)
        elderly_range = (4.0, 18.0)
        children_range = (8.0, 30.0)
        worker_range = (1.0, 10.0)
        grid_size = 20

    # 1 degree lat is ~ 111,111 meters
    # 20m is ~ 0.00018 degrees
    cell_deg_lat = 20.0 / 111111.0
    cell_deg_lon = 20.0 / (111111.0 * math.cos(math.radians(center_lat)))
    
    # A = 2.0: diurnal amplitude calibrated so the 15:00 peak stays physically
    # plausible for Phoenix 2m air temperature (≈ 44-47°C in a heat wave),
    # instead of the previous +5.0 that pushed modeled air temps to ~50°C.
    A = 2.0
    
    # Deterministic RNG: identical output on every process/restart (reproducible).
    rng = random.Random(_deterministic_seed(district_name))
    
    start_lat = center_lat - (grid_size/2) * cell_deg_lat
    start_lon = center_lon - (grid_size/2) * cell_deg_lon
    
    for i in range(grid_size):
        for j in range(grid_size):
            cell_lat = start_lat + i * cell_deg_lat
            cell_lon = start_lon + j * cell_deg_lon
            
            canopy = rng.uniform(*canopy_range)
            # Vegetation follows cool land-use features (parks, canal paths) and
            # vanishes over hot asphalt — keeps the canopy/MRT field coherent.
            canopy = max(0.0, min(0.85, canopy + _land_use_canopy_delta(district_name, cell_lat, cell_lon)))
            svi = rng.uniform(*svi_range)
            albedo = max(0.05, min(0.95, albedo_base + rng.uniform(-0.05, 0.05)))
            aspect_ratio = rng.uniform(0.5, 2.0)
            
            base_temp = rng.uniform(base_temp_min, base_temp_max)
            
            mod_canopy = -(canopy * 3.5)
            mod_albedo = -((albedo - 0.15) * 4.0)
            mod_aspect = (min(aspect_ratio, 2.0) * 0.6)   # capped street-canyon trapping term
            
            t_base_modified = base_temp + mod_canopy + mod_albedo + mod_aspect
            
            temp_2m = t_base_modified + A * math.sin(2 * math.pi * (hour - 9) / 24)
            # Deterministic land-use microclimate anomalies (arterials / cool islands).
            # Floor: even fully-irrigated park cores in Phoenix stay within ~8°C of
            # surrounding asphalt at 15:00 in a heat wave — clamp aggregate cooling.
            temp_2m += max(-9.0, _land_use_delta(district_name, cell_lat, cell_lon))
            # Physical bounds: hottest reliably-recorded 2m air temperature in
            # Maricopa County is ~48.3°C (clamp 48.0); irrigated cool-island cores
            # bottom out near 34°C at peak afternoon.
            temp_2m = min(48.0, max(34.0, temp_2m))
            surface_temp = temp_2m + rng.uniform(2.0, 10.0)
            
            polygon = [
                [cell_lon, cell_lat],
                [cell_lon + cell_deg_lon, cell_lat],
                [cell_lon + cell_deg_lon, cell_lat + cell_deg_lat],
                [cell_lon, cell_lat + cell_deg_lat],
                [cell_lon, cell_lat]
            ]
            
            cells.append({
                "id": f"{district_name.lower()}_{i:02d}_{j:02d}",
                "polygon": polygon,
                "lat": cell_lat + cell_deg_lat/2,
                "lon": cell_lon + cell_deg_lon/2,
                "temp_2m": round(temp_2m, 2),
                "surface_temp": round(surface_temp, 2),
                "albedo": round(albedo, 2),
                "aspect_ratio": round(aspect_ratio, 2),
                "humidity": round(rng.uniform(10.0, 25.0), 2),
                "wind_speed": round(rng.uniform(0.5, 3.5), 2),
                "canopy_cover": round(canopy, 2),
                "svi": round(svi, 2),
                "population_density": round(rng.uniform(*pop_range), 2),
                "elderly_density": round(rng.uniform(*elderly_range), 2),
                "children_density": round(rng.uniform(*children_range), 2),
                "outdoor_worker_density": round(rng.uniform(*worker_range), 2),
                "transit_stop_distance_m": round(rng.uniform(10, 2000), 2),
                "land_use_feature": _land_use_label(district_name, cell_lat, cell_lon),
                "data_provenance": DATA_PROVENANCE,
            })
            
    return cells

class SyntheticGridGenerator:
    @staticmethod
    def get_district_grid(district_name: str, hour: float = 15.0) -> List[Dict[str, Any]]:
        return generate_synthetic_grid(district_name, hour)
