"""
Grid Data Schemas
"""
from pydantic import BaseModel
from typing import List

class CellCoordinates(BaseModel):
    lat: float
    lon: float
    cell_id: str

class GridCell(BaseModel):
    id: str
    lat: float
    lon: float
    temp_2m: float
    canopy_cover: float
    albedo: float
    svi: float
    population_density: float

class GridResponse(BaseModel):
    cells: List[GridCell]
    timestamp: str
