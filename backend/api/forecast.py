from fastapi import APIRouter, Query
from typing import Dict, Any
from backend.analytics.forecast import generate_district_forecast

router = APIRouter(prefix="/api/forecast", tags=["forecast"])

@router.get("", response_model=Dict[str, Any])
def get_forecast(district: str = Query("Maryvale", description="District name"), hours_ahead: int = Query(24, ge=1, le=72)):
    """
    Returns 24h hourly forecast with dangerous-heat metrics and diurnal cycle.
    """
    base_temp = 42.0 if district.lower() == "maryvale" else 37.5
    return generate_district_forecast(district, base_temp=base_temp, hours_ahead=hours_ahead)
