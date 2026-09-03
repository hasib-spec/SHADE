"""
Cost-Effectiveness Score (CES) — REAL implementation, wired into the knapsack optimizer.

    CES_i,k = APS_i,k / Cost_k × (1 − 0.45 · e^(−d²/2σ²))    (σ = 25 m)

The Gaussian factor is the diminishing-returns overlap penalty applied as a function
of distance d to the nearest already-selected intervention site (see
optimization/overlap.py). Higher CES = more priority-per-dollar.
"""
import math
from typing import Dict, Any, Optional, Union

SIGMA_M = 25.0
MAX_OVERLAP_PENALTY = 0.45


def gaussian_overlap_factor(distance_m: Optional[float]) -> float:
    """(1 − 0.45·e^(−d²/2σ²)) — 1.0 when isolated, decays toward 0.55 when co-located."""
    if distance_m is None:
        return 1.0
    return 1.0 - MAX_OVERLAP_PENALTY * math.exp(-(distance_m ** 2) / (2 * SIGMA_M ** 2))


def calculate_ces(aps: float, cost_usd: Union[float, Dict[str, float]], distance_to_nearest_selected_m: Optional[float] = None) -> Union[float, Dict[str, float]]:
    """Cost-Effectiveness Score: priority per dollar, penalized for spatial overlap.
    Supports either scalar cost or dictionary of intervention costs."""
    if isinstance(cost_usd, dict):
        res = {}
        for k, c in cost_usd.items():
            res[k] = (aps / c) * gaussian_overlap_factor(distance_to_nearest_selected_m) if c > 0 else 0.0
        return res
    if cost_usd <= 0:
        return 0.0
    return (aps / cost_usd) * gaussian_overlap_factor(distance_to_nearest_selected_m)
