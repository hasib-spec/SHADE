"""
Intervention Schemas
"""
from pydantic import BaseModel
from enum import Enum

class InterventionType(str, Enum):
    tree_canopy = "tree_canopy"
    shade_structure = "shade_structure"
    cool_pavement = "cool_pavement"
    misting = "misting"

class InterventionRequest(BaseModel):
    cell_id: str
    intervention_type: InterventionType

class CoolingDelta(BaseModel):
    delta_t_air: float
    delta_t_mrt: float

class InterventionResult(BaseModel):
    cell_id: str
    intervention_type: InterventionType
    cooling_delta: CoolingDelta
    projected_temp: float
