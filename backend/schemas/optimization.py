"""
Optimization Schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from .intervention import InterventionType

class BudgetRequest(BaseModel):
    budget_usd: float = Field(50000.0, description="Total budget in USD")
    district: str = Field("Maryvale", description="District name (Maryvale / Arcadia)")
    target_region: Optional[str] = "Maryvale"
    target_demographic: str = Field("elderly", description="Target vulnerable group: elderly, children, outdoor_workers, general")
    prioritize_vulnerable: bool = True
    allowed_interventions: Optional[List[InterventionType]] = None

class AllocationItem(BaseModel):
    cell_id: str
    intervention_type: InterventionType
    cost: float
    cooling_delta: float
    residents_covered: int

class AllocationPlan(BaseModel):
    items: List[AllocationItem]
    total_cost: float
    total_residents_covered: int
    avg_projected_delta_t: float
