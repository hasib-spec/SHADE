"""
Forecast Schemas
"""
from pydantic import BaseModel
from typing import List

class HourlyForecast(BaseModel):
    hour_offset: int
    timestamp: str
    temp_2m: float

class ForecastRequest(BaseModel):
    lat: float
    lon: float
    hours_ahead: int = 24

class ForecastResponse(BaseModel):
    cell_id: str
    forecast: List[HourlyForecast]
