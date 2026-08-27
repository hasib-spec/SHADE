from fastapi import APIRouter, Query
from typing import List, Dict, Any
from backend.data.synthetic_grid import generate_synthetic_grid
from backend.analytics.heri import calculate_heri

router = APIRouter(prefix="/api/grid", tags=["grid"])

@router.get("", response_model=List[Dict[str, Any]])
def get_grid(district: str = Query("Maryvale", description="District name: Maryvale or Arcadia"), hour: float = Query(15.0, description="Hour of day (0-24)")):
    """
    Returns full 20m² cell dataset with HERI scores, temperature, canopy, SVI, 
    and polygon bounds for selected district.
    """
    raw_cells = generate_synthetic_grid(district, hour)
    enriched_cells = calculate_heri(raw_cells)
    return enriched_cells
