from fastapi import APIRouter
from backend.schemas.intervention import InterventionRequest, InterventionResult, CoolingDelta, InterventionType
from backend.schemas.optimization import BudgetRequest, AllocationPlan
from backend.inference.surrogate_model import InterventionSurrogateModel
from backend.optimization.knapsack import BudgetKnapsackSolver
from backend.data.synthetic_grid import generate_synthetic_grid
from backend.analytics.heri import calculate_heri

router = APIRouter(prefix="/api/interventions", tags=["interventions"])

surrogate_model = InterventionSurrogateModel()
knapsack_solver = BudgetKnapsackSolver(surrogate_model=surrogate_model)

@router.post("/simulate", response_model=InterventionResult)
def simulate_intervention(request: InterventionRequest):
    """
    Runs surrogate model for a specific cell & intervention.
    Returns simulated deltas for air temp and MRT at the 2m pedestrian plane.
    """
    env_features = {
        'canopy_density': 0.06,
        'surface_albedo': 0.12,
        'aspect_ratio': 1.2,
        'humidity': 18.0,
        'wind_speed': 2.0,
        'base_temp': 44.5
    }
    evaluation = surrogate_model.evaluate_intervention(request.intervention_type, env_features)
    
    return InterventionResult(
        cell_id=request.cell_id,
        intervention_type=request.intervention_type,
        cooling_delta=evaluation["cooling_delta"],
        projected_temp=evaluation["projected_temp_2m"]
    )

@router.post("/optimize", response_model=AllocationPlan)
def optimize_budget(request: BudgetRequest):
    """
    Runs spatial knapsack solver for a budget allocation request.
    Optimizes intervention placements with spatial overlap penalty.
    """
    cells = generate_synthetic_grid(request.district, hour=15.0)
    enriched = calculate_heri(cells)
    
    # Filter for top hotspots
    enriched.sort(key=lambda c: c.get("heri_score", 0.0), reverse=True)
    hotspots = enriched[:50]
    
    plan = knapsack_solver.solve(
        hotspot_cells=hotspots,
        total_budget=request.budget_usd,
        allowed_interventions=request.allowed_interventions or list(InterventionType),
        target_demographic=request.target_demographic
    )
    return plan
