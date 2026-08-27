"""
Cooling Matrix based on empirical microclimate literature.
"""

from typing import Dict, TypedDict, Tuple

class CoolingImpact(TypedDict):
    air_delta: Tuple[float, float, float]  # (min, max, mean)
    mrt_delta: Tuple[float, float, float]
    surface_delta: float

COOLING_MATRIX: Dict[str, CoolingImpact] = {
    "tree_canopy": {
        "air_delta": (-3.8, -1.0, -2.2),
        "mrt_delta": (-12.0, -6.0, -9.0),
        "surface_delta": -8.0
    },
    "shade_structure": {
        "air_delta": (-2.5, -1.5, -2.0),
        "mrt_delta": (-20.0, -10.0, -15.0),
        "surface_delta": -12.0
    },
    "cool_pavement": {
        "air_delta": (-1.2, -0.6, -0.8),
        "mrt_delta": (-3.0, -3.0, -3.0),
        "surface_delta": -7.5
    },
    "misting": {
        "air_delta": (-5.0, -3.0, -4.0),
        "mrt_delta": (-5.0, -5.0, -5.0),
        "surface_delta": -2.0
    }
}
