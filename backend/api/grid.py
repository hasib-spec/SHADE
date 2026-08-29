from fastapi import APIRouter, Query
from typing import List, Dict, Any, Optional
from backend.data.synthetic_grid import generate_synthetic_grid
from backend.analytics.heri import calculate_heri
from backend.data.global_geocoder import extract_location_from_query, fetch_live_hyperlocal_weather, generate_global_20m_grid

router = APIRouter(prefix="/api/grid", tags=["grid"])

@router.get("", response_model=List[Dict[str, Any]])
def get_grid(
    district: str = Query("Maryvale", description="District name or global location"),
    hour: float = Query(15.0, description="Hour of day (0-24)"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude")
):
    """
    Returns full 20m² cell dataset with HERI scores, temperature, canopy, SVI, 
    and polygon bounds for ANY selected district or global coordinate on Earth.
    """
    # 1. Check explicit lat/lon
    if lat is not None and lon is not None:
        wx = fetch_live_hyperlocal_weather(lat, lon)
        cells = generate_global_20m_grid(
            center_lat=lat,
            center_lon=lon,
            location_name=district,
            base_temp_2m=wx["temp_2m"],
            base_humidity=wx["humidity"]
        )
        return calculate_heri(cells)

    # 2. Check if district is a standard pilot district
    d_lower = district.lower().strip()
    if d_lower in ("maryvale", "arcadia"):
        raw_cells = generate_synthetic_grid(district, hour)
        return calculate_heri(raw_cells)

    # 3. Global Geocoding for any named location
    loc = extract_location_from_query(district)
    if loc:
        wx = fetch_live_hyperlocal_weather(loc["lat"], loc["lon"])
        cells = generate_global_20m_grid(
            center_lat=loc["lat"],
            center_lon=loc["lon"],
            location_name=loc["name"],
            base_temp_2m=wx["temp_2m"],
            base_humidity=wx["humidity"],
            svi_baseline=loc.get("svi", 0.80),
            canopy_baseline=loc.get("canopy", 0.05)
        )
        return calculate_heri(cells)

    # Default fallback to Maryvale
    raw_cells = generate_synthetic_grid("Maryvale", hour)
    return calculate_heri(raw_cells)
