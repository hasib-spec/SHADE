"""
Action Priority Score (APS) — REAL implementation, wired into the knapsack optimizer.

    APS_i,k = HERI_i × P_i × |ΔT_2m,k| × w_demographic

- HERI_i:  Heat Equity Risk Index of cell i (0-100, see analytics/heri.py)
- P_i:     density of the targeted demographic in cell i (residents/cell)
- |ΔT_2m,k|: absolute predicted 2m air-temperature reduction of intervention k (°C)
- w_demographic: equity weight for the targeted demographic
"""
from typing import Dict, Any

# Equity weights for targeted demographics (documented defaults).
DEMOGRAPHIC_WEIGHTS: Dict[str, float] = {
    "elderly": 1.25,
    "children": 1.15,
    "outdoor_workers": 1.10,
    "general": 1.0,
}


def calculate_aps(cell: Dict[str, Any], cooling_delta_air: float, target_demographic: str = "elderly") -> float:
    """Action Priority Score for (cell, intervention) pair. Higher = deploy sooner."""
    heri = float(cell.get("heri_score", 50.0))
    if target_demographic.lower() == "elderly":
        pop = float(cell.get("elderly_density", 45.0))
    elif target_demographic.lower() == "children":
        pop = float(cell.get("children_density", 60.0))
    elif target_demographic.lower() == "outdoor_workers":
        pop = float(cell.get("outdoor_worker_density", 25.0))
    else:
        pop = float(cell.get("population_density", 120.0))

    weight = DEMOGRAPHIC_WEIGHTS.get(target_demographic.lower(), 1.0)
    return heri * pop * abs(cooling_delta_air) * weight
