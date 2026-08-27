"""
HERI (Heat Equity Risk Index) Schemas
"""
from pydantic import BaseModel
from typing import List

class HERIResult(BaseModel):
    cell_id: str
    lat: float
    lon: float
    heri_score: float
    temp_2m: float
    svi: float
    canopy_cover: float

class HERIParams(BaseModel):
    region_bbox: List[float]
    time_target: str
