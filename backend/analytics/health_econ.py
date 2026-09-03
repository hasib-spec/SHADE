"""
Shared health-economic ROI model — single source of truth.

Used by BOTH /api/correlation/health-impact and /api/agent/chat so the two
endpoints can never disagree. Every assumption is explicit and returned in the
output; nothing is hardcoded per-endpoint. This is a transparent arithmetic
MODEL over literature-anchored default coefficients — it produces modeled
estimates for planning discussion, not empirical measurements.
"""
from typing import Dict, Any, List

# --- Documented default coefficients (literature-anchored, clearly labeled) ---
COOLING_EFFICIENCY_C_PER_50K = 2.4      # °C avg reduction per $50k deployed (modeled via surrogate cooling matrix)
VISITS_AVOIDED_PER_C_PER_1000_ELDERLY = 3.8  # default transfer coefficient
COST_PER_HEAT_ED_VISIT_USD = 7900.0     # default unit cost assumption
PRODUCTIVITY_HOURS_PER_UNIT_COOLING = 400.0  # modeled hours recovered per unit cooling efficiency
AVG_WAGE_USD_PER_HOUR = 28.0


def compute_health_econ_roi(
    budget: float,
    avg_temp: float,
    avg_svi: float,
    total_elderly: int,
) -> Dict[str, Any]:
    """Deterministic, documented ROI arithmetic. All assumptions echoed in output."""
    cooling_efficiency = COOLING_EFFICIENCY_C_PER_50K * (float(budget) / 50000.0)
    temp_excess = max(0.0, float(avg_temp) - 40.0)

    visits_avoided = int(
        cooling_efficiency * VISITS_AVOIDED_PER_C_PER_1000_ELDERLY * (float(total_elderly) / 1000.0) * avg_svi
    )
    visits_avoided = max(1, visits_avoided)

    medical_savings = visits_avoided * COST_PER_HEAT_ED_VISIT_USD
    productivity_hours = int(cooling_efficiency * PRODUCTIVITY_HOURS_PER_UNIT_COOLING * avg_svi)
    productivity_value = productivity_hours * AVG_WAGE_USD_PER_HOUR

    net_benefit = medical_savings + productivity_value - float(budget)
    bcr = round((medical_savings + productivity_value) / max(1.0, float(budget)), 2)

    assumptions: List[str] = [
        f"Cooling efficiency: {COOLING_EFFICIENCY_C_PER_50K}°C average reduction per $50k deployed (surrogate cooling matrix).",
        f"Visits avoided: {VISITS_AVOIDED_PER_C_PER_1000_ELDERLY} per °C per 1,000 elderly residents (default transfer coefficient, SVI-weighted).",
        f"Unit cost per heat-related ED visit: ${COST_PER_HEAT_ED_VISIT_USD:,.0f} (default assumption).",
        f"Productivity: hours recovered at ${AVG_WAGE_USD_PER_HOUR}/h (default assumption).",
        "All figures are modeled estimates for municipal planning discussion — not empirical post-intervention measurements.",
    ]

    return {
        "intervention_budget_usd": float(budget),
        "projected_hospital_visits_avoided": visits_avoided,
        "direct_medical_cost_savings_usd": round(medical_savings, 2),
        "worker_productivity_hours_saved": productivity_hours,
        "net_economic_benefit_usd": round(net_benefit, 2),
        "benefit_cost_ratio": bcr,
        "is_modeled_estimate": True,
        "assumptions": assumptions,
        "temp_excess_c": round(temp_excess, 2),
    }
