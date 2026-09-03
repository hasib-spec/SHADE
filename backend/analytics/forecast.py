"""
24h Heat Forecast Engine.

REAL DATA PRIORITY:
1. If Open-Meteo is reachable, the forecast is driven by REAL hourly 2m temperature
   forecasts for the district's coordinates (Open-Meteo is a free, no-key weather API
   aggregating national weather services' models).
2. If the network is unavailable, we fall back to the documented sinusoidal diurnal
   model and MARK the source accordingly ("modeled_diurnal_fallback").

The response always carries a `source` field so no consumer can mistake a modeled
curve for a meteorological forecast.
"""
import math
import logging
from typing import List, Dict, Any, Optional
import httpx

logger = logging.getLogger(__name__)

DISTRICT_COORDS: Dict[str, Dict[str, float]] = {
    "maryvale": {"lat": 33.4942, "lon": -112.1771},
    "arcadia": {"lat": 33.4980, "lon": -111.9540},
}

DANGEROUS_C = 40.0


def _risk_level(temp: float) -> str:
    if temp > 42.0:
        return "CRITICAL"
    if temp > DANGEROUS_C:
        return "HIGH"
    if temp > 35.0:
        return "MODERATE"
    return "LOW"


def _peak_fields(forecasts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Peak summary derived from the actual forecast series (for SMS/alert consumers)."""
    if not forecasts:
        return {"peak_temp_c": None, "peak_time": None}
    peak = max(forecasts, key=lambda f: f.get("temp_2m", 0))
    hod = peak.get("hour_of_day")
    return {
        "peak_temp_c": peak.get("temp_2m"),
        "peak_time": f"{int(hod):02d}:00" if hod is not None else None,
    }


def _model_forecast(district_name: str, base_temp: float, hours_ahead: int) -> Dict[str, Any]:
    """Deterministic diurnal fallback model (offline mode)."""
    inertia = 1.0
    if district_name.lower() == "maryvale":
        inertia = 1.2  # modeled thermal inertia: low canopy -> stays hotter longer
    elif district_name.lower() == "arcadia":
        inertia = 0.8

    forecasts = []
    dangerous = 0
    for h in range(hours_ahead):
        hour_of_day = h % 24
        amplitude = 6.0 * inertia
        temp = base_temp + amplitude * math.sin(2 * math.pi * (hour_of_day - 9) / 24)
        if temp > DANGEROUS_C:
            dangerous += 1
        forecasts.append({
            "hour_offset": h,
            "hour_of_day": hour_of_day,
            "temp_2m": round(temp, 2),
            "humidity": round(max(10, 30 - (temp - 30)), 2),
            "wind_speed": 2.5,
            "heat_risk_level": _risk_level(temp),
        })
    return {
        "district": district_name,
        "hours_ahead": hours_ahead,
        "dangerous_heat_hours": dangerous,
        "forecast": forecasts,
        "source": "modeled_diurnal_fallback (offline)",
        "is_modeled": True,
        **_peak_fields(forecasts),
    }


def _open_meteo_forecast(district_name: str, hours_ahead: int) -> Optional[Dict[str, Any]]:
    """REAL hourly forecast from Open-Meteo for the district coordinates."""
    coords = DISTRICT_COORDS.get(district_name.lower().strip())
    if coords is None:
        return None
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={coords['lat']}&longitude={coords['lon']}"
            f"&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m"
            f"&forecast_days=2&timezone=auto"
        )
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(url)
            if resp.status_code != 200:
                return None
            data = resp.json()
        hourly = data.get("hourly", {})
        temps = hourly.get("temperature_2m", []) or []
        times = hourly.get("time", []) or []
        humidity = hourly.get("relative_humidity_2m", []) or []
        wind = hourly.get("wind_speed_10m", []) or []
        if not temps:
            return None

        n = min(hours_ahead, len(temps))
        forecasts = []
        dangerous = 0
        for h in range(n):
            t = float(temps[h])
            if t > DANGEROUS_C:
                dangerous += 1
            forecasts.append({
                "hour_offset": h,
                "hour_of_day": int(times[h][11:13]) if len(times) > h and times[h] else h % 24,
                "temp_2m": round(t, 2),
                "humidity": round(float(humidity[h]), 2) if len(humidity) > h and humidity[h] is not None else None,
                "wind_speed": round(float(wind[h]), 2) if len(wind) > h and wind[h] is not None else None,
                "heat_risk_level": _risk_level(t),
            })
        return {
            "district": district_name,
            "hours_ahead": n,
            "dangerous_heat_hours": dangerous,
            "forecast": forecasts,
            "source": "Open-Meteo hourly forecast (real meteorological model data)",
            "is_modeled": False,
            **_peak_fields(forecasts),
        }
    except Exception as e:
        logger.warning("Open-Meteo forecast failed for %s: %s", district_name, e)
        return None


def generate_district_forecast(district_name: str, base_temp: float = 42.0, hours_ahead: int = 24) -> Dict[str, Any]:
    """
    24h heat profile. REAL Open-Meteo hourly forecast when the network allows;
    otherwise the documented diurnal fallback model. `source` and `is_modeled`
    always disclose which path produced the numbers.
    """
    live = _open_meteo_forecast(district_name, hours_ahead)
    if live is not None:
        return live
    return _model_forecast(district_name, base_temp, hours_ahead)
