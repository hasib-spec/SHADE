from fastapi import APIRouter, Query
from typing import Dict, Any, Optional
from backend.analytics.forecast import generate_district_forecast
from backend.data.global_geocoder import extract_location_from_query, fetch_live_hyperlocal_weather

router = APIRouter(prefix="/api/forecast", tags=["forecast"])

@router.get("", response_model=Dict[str, Any])
def get_forecast(
    district: str = Query("Maryvale", description="District name or global location"),
    hours_ahead: int = Query(24, ge=1, le=72),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude")
):
    """
    Returns 24h hourly forecast with dangerous-heat metrics and diurnal cycle for any location worldwide.
    """
    if lat is not None and lon is not None and not (lat == 0 and lon == 0):
        wx = fetch_live_hyperlocal_weather(lat, lon)
        hourly_data = []
        for h, temp in enumerate(wx["hourly_temps"][:hours_ahead]):
            risk = "CRITICAL" if temp >= 42.0 else ("HIGH" if temp >= 38.0 else "MODERATE")
            hourly_data.append({
                "hour": h,
                "temperature": temp,
                "humidity": wx["humidity"],
                "wind_speed": wx["wind_speed"],
                "heat_risk_level": risk
            })
        peak_hour = int(wx["hourly_temps"].index(max(wx["hourly_temps"]))) if wx["hourly_temps"] else 15
        return {
            "district": district,
            "projected_peak_hour": peak_hour,
            "dangerous_heat_hours_count": sum(1 for t in wx["hourly_temps"][:hours_ahead] if t >= 40.0),
            "hourly_forecasts": hourly_data
        }

    loc = extract_location_from_query(district)
    if loc and loc.get("is_global", False):
        wx = fetch_live_hyperlocal_weather(loc["lat"], loc["lon"])
        hourly_data = []
        for h, temp in enumerate(wx["hourly_temps"][:hours_ahead]):
            risk = "CRITICAL" if temp >= 42.0 else ("HIGH" if temp >= 38.0 else "MODERATE")
            hourly_data.append({
                "hour": h,
                "temperature": temp,
                "humidity": wx["humidity"],
                "wind_speed": wx["wind_speed"],
                "heat_risk_level": risk
            })
        peak_hour = int(wx["hourly_temps"].index(max(wx["hourly_temps"]))) if wx["hourly_temps"] else 15
        return {
            "district": loc["name"],
            "projected_peak_hour": peak_hour,
            "dangerous_heat_hours_count": sum(1 for t in wx["hourly_temps"][:hours_ahead] if t >= 40.0),
            "hourly_forecasts": hourly_data
        }

    base_temp = 42.0 if district.lower() == "maryvale" else 37.5
    return generate_district_forecast(district, base_temp=base_temp, hours_ahead=hours_ahead)
