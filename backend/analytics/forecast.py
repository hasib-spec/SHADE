import math
from typing import List, Dict, Any

def generate_district_forecast(district_name: str, base_temp: float, hours_ahead: int = 24) -> Dict[str, Any]:
    """
    Generates an hourly forecast for a district.
    Models temperature evolution and identifies dangerous heat hours (>40C).
    """
    forecasts = []
    dangerous_hours_count = 0
    
    # Simple thermal inertia effect based on district
    inertia = 1.0
    if district_name.lower() == "maryvale":
        inertia = 1.2 # stays hotter longer
    elif district_name.lower() == "arcadia":
        inertia = 0.8
        
    for h in range(hours_ahead):
        # Assuming h=0 corresponds to current hour, or base hour.
        # But we'll just offset based on an assumed hour. Let's make hour_of_day based on an absolute offset if needed.
        # For simplicity, we just use h directly.
        hour_of_day = h % 24
        
        # Diurnal temp variation: T_base + A * sin(2*pi*(h - 9)/24)
        A = 6.0 * inertia
        temp_2m = base_temp + A * math.sin(2 * math.pi * (hour_of_day - 9) / 24)
        
        is_dangerous = temp_2m > 40.0
        if is_dangerous:
            dangerous_hours_count += 1
            
        risk_level = "LOW"
        if temp_2m > 42.0:
            risk_level = "CRITICAL"
        elif temp_2m > 40.0:
            risk_level = "HIGH"
        elif temp_2m > 35.0:
            risk_level = "MODERATE"
            
        forecasts.append({
            "hour_offset": h,
            "hour_of_day": hour_of_day,
            "temp_2m": round(temp_2m, 2),
            "humidity": round(max(10, 30 - (temp_2m - 30)), 2),
            "wind_speed": 2.5,
            "heat_risk_level": risk_level
        })
        
    return {
        "district": district_name,
        "hours_ahead": hours_ahead,
        "dangerous_heat_hours": dangerous_hours_count,
        "forecast": forecasts
    }
