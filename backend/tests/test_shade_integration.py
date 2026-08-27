import pytest
from backend.data.synthetic_grid import generate_synthetic_grid
from backend.analytics.heri import calculate_heri
from backend.analytics.forecast import generate_district_forecast
from backend.inference.surrogate_model import InterventionSurrogateModel
from backend.schemas.intervention import InterventionType
from backend.optimization.knapsack import BudgetKnapsackSolver
from backend.exporters.geojson import generate_geojson_workorder
from backend.exporters.sms import generate_sms_alerts

def test_maryvale_vs_arcadia_equity_gap():
    """
    Verifies that Maryvale exhibits significantly higher HERI risk than Arcadia
    due to low canopy, high SVI, and heat-trapping albedo.
    """
    maryvale_cells = generate_synthetic_grid("Maryvale", hour=15.0)
    arcadia_cells = generate_synthetic_grid("Arcadia", hour=15.0)
    
    mv_enriched = calculate_heri(maryvale_cells)
    arc_enriched = calculate_heri(arcadia_cells)
    
    mv_avg_temp = sum(c["temp_2m"] for c in mv_enriched) / len(mv_enriched)
    arc_avg_temp = sum(c["temp_2m"] for c in arc_enriched) / len(arc_enriched)
    
    mv_avg_svi = sum(c["svi"] for c in mv_enriched) / len(mv_enriched)
    arc_avg_svi = sum(c["svi"] for c in arc_enriched) / len(arc_enriched)
    
    assert mv_avg_temp > arc_avg_temp, "Maryvale must be hotter than Arcadia"
    assert mv_avg_svi > arc_avg_svi, "Maryvale SVI must be higher than Arcadia"
    assert len(mv_enriched) == 400
    assert len(arc_enriched) == 400

def test_surrogate_model_cooling_predictions():
    """
    Verifies that the trained surrogate model predicts realistic cooling deltas
    calibrated at the 2m pedestrian plane.
    """
    model = InterventionSurrogateModel()
    env = {
        'canopy_density': 0.05,
        'surface_albedo': 0.12,
        'aspect_ratio': 1.5,
        'humidity': 15.0,
        'wind_speed': 2.0,
        'base_temp': 44.5
    }
    
    shade_res = model.evaluate_intervention(InterventionType.shade_structure, env)
    tree_res = model.evaluate_intervention(InterventionType.tree_canopy, env)
    pave_res = model.evaluate_intervention(InterventionType.cool_pavement, env)
    mist_res = model.evaluate_intervention(InterventionType.misting, env)
    
    # Check cooling deltas are negative
    assert shade_res["cooling_delta"].delta_t_air < 0
    assert tree_res["cooling_delta"].delta_t_air < 0
    assert pave_res["cooling_delta"].delta_t_air < 0
    assert mist_res["cooling_delta"].delta_t_air < 0
    
    # Check Mean Radiant Temperature impact for shade structures (-15°C)
    assert shade_res["cooling_delta"].delta_t_mrt <= -10.0

def test_budget_knapsack_optimization():
    """
    Tests the budget-constrained spatial knapsack solver with Maryvale hotspots.
    """
    cells = generate_synthetic_grid("Maryvale", hour=15.0)
    enriched = calculate_heri(cells)
    enriched.sort(key=lambda c: c.get("heri_score", 0.0), reverse=True)
    hotspots = enriched[:50]
    
    solver = BudgetKnapsackSolver()
    plan = solver.solve(
        hotspot_cells=hotspots,
        total_budget=50000.0,
        allowed_interventions=list(InterventionType),
        target_demographic="elderly"
    )
    
    assert plan.total_cost <= 50000.0
    assert len(plan.items) > 0
    assert plan.total_residents_covered > 0
    assert plan.avg_projected_delta_t < 0

def test_municipal_exporters():
    """
    Verifies that QGIS GeoJSON work orders and bilingual SMS alert drafts are generated.
    """
    cells = generate_synthetic_grid("Maryvale", hour=15.0)
    enriched = calculate_heri(cells)
    enriched.sort(key=lambda c: c.get("heri_score", 0.0), reverse=True)
    hotspots = enriched[:50]
    
    solver = BudgetKnapsackSolver()
    plan = solver.solve(hotspots, 50000.0, list(InterventionType), "elderly")
    
    geojson = generate_geojson_workorder(plan, cells)
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) == len(plan.items)
    assert "work_order_id" in geojson["features"][0]["properties"]
    
    forecast = generate_district_forecast("Maryvale", base_temp=42.0, hours_ahead=24)
    sms = generate_sms_alerts(hotspots[:5], forecast, "elderly")
    assert len(sms) == 5
    assert "URGENT" in sms[0]["english"]
    assert "URGENTE" in sms[0]["spanish"]
