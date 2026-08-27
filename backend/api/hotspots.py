from fastapi import APIRouter, Query
from typing import List, Dict, Any
from backend.data.synthetic_grid import generate_synthetic_grid
from backend.analytics.heri import calculate_heri

router = APIRouter(prefix="/api/hotspots", tags=["hotspots"])

@router.get("", response_model=List[Dict[str, Any]])
def get_hotspots(district: str = Query("Maryvale", description="District name"), limit: int = Query(10, ge=1, le=100)):
    """
    Returns top HERI hotspot cells with demographic risk metadata.
    """
    cells = generate_synthetic_grid(district, hour=15.0)
    enriched = calculate_heri(cells)
    # Sort descending by heri_score
    enriched.sort(key=lambda c: c.get("heri_score", 0.0), reverse=True)
    return enriched[:limit]
