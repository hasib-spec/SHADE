"""
Decision Tools for SHADE Agent.
These tools connect directly to the L1-L4 backend computation engines.
"""
from typing import Dict, Any, List, Optional
from backend.data.synthetic_grid import generate_synthetic_grid
from backend.analytics.heri import calculate_heri
from backend.analytics.forecast import generate_district_forecast
from backend.inference.surrogate_model import InterventionSurrogateModel
from backend.schemas.intervention import InterventionType
from backend.optimization.knapsack import BudgetKnapsackSolver
from backend.exporters.geojson import generate_geojson_workorder
from backend.exporters.sms import generate_sms_alerts

try:
    from langchain_core.tools import tool
except ImportError:
    # Fallback decorator when langchain_core is not installed
    def tool(func):
        return func

surrogate_model = InterventionSurrogateModel()
knapsack_solver = BudgetKnapsackSolver(surrogate_model=surrogate_model)

@tool
def calculate_hotspots(district: str = "Maryvale", limit: int = 10) -> List[Dict[str, Any]]:
    """
    Calculates and returns the top ranked micro-hotspot cells with street context for a given district.
    Uses the Heat Equity Risk Index (HERI) which factors in 20m² temperature, CDC SVI, and canopy deficit.
    """
    cells = generate_synthetic_grid(district, hour=15.0)
    enriched = calculate_heri(cells)
    enriched.sort(key=lambda c: c.get("heri_score", 0.0), reverse=True)
    return enriched[:limit]

@tool
def forecast_heat(district: str = "Maryvale", hours_ahead: int = 24) -> Dict[str, Any]:
    """
    Returns the 24h predictive heat profile for a given district.
    Provides peak temperature, peak time (e.g. 15:00), dangerous heat duration (>40°C), and hourly evolution.
    """
    base_temp = 42.0 if district.lower() == "maryvale" else 37.5
    return generate_district_forecast(district, base_temp=base_temp, hours_ahead=hours_ahead)

@tool
def simulate_cooling_intervention(cell_id: str, intervention_type: str) -> Dict[str, Any]:
    """
    Simulates a cooling intervention for a specific 20m² cell at the 2m pedestrian plane.
    Valid interventions: 'tree_canopy', 'shade_structure', 'cool_pavement', 'misting'.
    Returns predicted cooling deltas for 2m air temp and Mean Radiant Temperature (MRT).
    """
    env_features = {
        'canopy_density': 0.06,
        'surface_albedo': 0.12,
        'aspect_ratio': 1.2,
        'humidity': 18.0,
        'wind_speed': 2.0,
        'base_temp': 44.5
    }
    try:
        inv_enum = InterventionType(intervention_type.lower())
    except ValueError:
        inv_enum = InterventionType.shade_structure
        
    eval_result = surrogate_model.evaluate_intervention(inv_enum, env_features)
    delta = eval_result["cooling_delta"]
    return {
        "cell_id": cell_id,
        "intervention_type": inv_enum.value,
        "delta_t_air_c": delta.delta_t_air,
        "delta_t_mrt_c": delta.delta_t_mrt,
        "projected_temp_2m_c": eval_result["projected_temp_2m"]
    }

@tool
def generate_municipal_output(budget_usd: float = 50000.0, district: str = "Maryvale", target_demographic: str = "elderly") -> Dict[str, Any]:
    """
    Runs spatial knapsack optimization for a budget allocation request and generates
    a QGIS-ready GeoJSON work order and bilingual English/Spanish SMS alerts.
    Returns complete deployment plan, work order summary, and SMS alert drafts.
    """
    cells = generate_synthetic_grid(district, hour=15.0)
    enriched = calculate_heri(cells)
    enriched.sort(key=lambda c: c.get("heri_score", 0.0), reverse=True)
    hotspots = enriched[:50]
    
    plan = knapsack_solver.solve(
        hotspot_cells=hotspots,
        total_budget=budget_usd,
        allowed_interventions=list(InterventionType),
        target_demographic=target_demographic
    )
    
    work_order_geojson = generate_geojson_workorder(plan, cells)
    forecast = generate_district_forecast(district, base_temp=42.0, hours_ahead=24)
    sms_alerts = generate_sms_alerts(hotspots[:5], forecast, target_demographic)
    
    return {
        "budget_requested": budget_usd,
        "budget_spent": plan.total_cost,
        "total_interventions": len(plan.items),
        "residents_covered": plan.total_residents_covered,
        "avg_projected_cooling_c": plan.avg_projected_delta_t,
        "work_order_geojson": work_order_geojson,
        "sms_alerts": sms_alerts
    }
