"""
Epidemiological Health Correlation & Municipal ROI Engine (Track 7 Showcase).

METHODOLOGY — what is real here, stated plainly:
1. REAL STATISTICS: we fit an ordinary-least-squares regression (scipy.stats.linregress)
   of modeled 2m air temperature on tree-canopy cover across the pooled 800-cell
   microclimate mesh (Maryvale + Arcadia). Slope, R², and p-value are genuinely
   computed from that data — they quantify the modeled heat-canopy gradient in the
   mesh. They are NOT health-outcome regressions.
2. LITERATURE-ANCHORED TRANSFER COEFFICIENTS: health and economic projections use
   transparent per-°C coefficients anchored to published Maricopa County findings
   (645 heat-associated deaths in 2023, MCDPH). These coefficients are defaults for
   demonstration, NOT regressions fit by SHADE, and the API labels them as such.
3. TRANSPARENT ROI MODEL: the benefit-cost output is a deterministic, documented
   arithmetic model over those coefficients (see `_compute_roi`). It is a modeled
   estimate, not an empirical measurement.
"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import math
import logging
from scipy import stats as scipy_stats

from backend.data.synthetic_grid import SyntheticGridGenerator

router = APIRouter(prefix="/api/correlation", tags=["correlation"])
logger = logging.getLogger(__name__)


class StatisticalValidation(BaseModel):
    method: str
    x_variable: str
    y_variable: str
    n_observations: int
    slope_per_unit: float
    r_squared: float
    p_value: float
    interpretation: str
    honesty_note: str


class OutcomeCorrelation(BaseModel):
    metric_name: str
    coefficient_per_celsius: str
    coefficient_basis: str
    projected_impact: str
    description: str
    maricopa_county_baseline: str
    baseline_source: str


class DemographicInequity(BaseModel):
    district: str
    avg_temp_2m_c: float
    tree_canopy_pct: float
    tree_canopy_source: str
    svi_score: float
    svi_source: str
    heat_er_admissions_per_100k: str
    annual_heat_mortality_rate: str


class HealthEconomicROI(BaseModel):
    intervention_budget_usd: float
    projected_hospital_visits_avoided: int
    direct_medical_cost_savings_usd: float
    worker_productivity_hours_saved: int
    net_economic_benefit_usd: float
    benefit_cost_ratio: float
    is_modeled_estimate: bool = True
    assumptions: List[str]


class CorrelationStudyResponse(BaseModel):
    statistical_validation: StatisticalValidation
    outcomes: List[OutcomeCorrelation]
    district_comparison: List[DemographicInequity]
    roi_summary: HealthEconomicROI


def _compute_district_stats(district_name: str, hour: float = 15.0) -> Dict[str, float]:
    """Compute aggregate statistics from the deterministic modeled grid for a district."""
    cells = SyntheticGridGenerator.get_district_grid(district_name, hour)
    if not cells:
        return {"avg_temp": 42.0, "avg_canopy": 0.10, "avg_svi": 0.50, "max_temp": 45.0,
                "total_elderly": 0, "cell_count": 0, "std_temp": 1.0}

    temps = [c.get("temp_2m", 42.0) for c in cells]
    canopies = [c.get("canopy_cover", 0.10) for c in cells]
    svis = [c.get("svi", 0.50) for c in cells]
    elderly = [c.get("elderly_density", 50) for c in cells]

    avg_temp = sum(temps) / len(temps)
    avg_canopy = sum(canopies) / len(canopies)
    avg_svi = sum(svis) / len(svis)
    max_temp = max(temps)
    total_elderly = sum(elderly)
    std_temp = math.sqrt(sum((t - avg_temp) ** 2 for t in temps) / len(temps)) if len(temps) > 1 else 1.0

    return {
        "avg_temp": round(avg_temp, 2),
        "max_temp": round(max_temp, 2),
        "avg_canopy": round(avg_canopy, 4),
        "avg_svi": round(avg_svi, 3),
        "std_temp": round(std_temp, 3),
        "total_elderly": int(total_elderly),
        "cell_count": len(cells)
    }


def _compute_temp_canopy_regression(hour: float = 15.0) -> Optional[StatisticalValidation]:
    """
    REAL OLS regression: modeled 2m temperature ~ canopy cover, pooled across both
    districts (n = 800 cells). Uses scipy.stats.linregress — slope, R², and p-value
    are genuinely computed, not asserted.
    """
    try:
        maryvale = SyntheticGridGenerator.get_district_grid("Maryvale", hour)
        arcadia = SyntheticGridGenerator.get_district_grid("Arcadia", hour)
        pooled = maryvale + arcadia
        x = [c["canopy_cover"] for c in pooled]
        y = [c["temp_2m"] for c in pooled]
        if len(x) < 10:
            return None
        res = scipy_stats.linregress(x, y)
        return StatisticalValidation(
            method="Ordinary Least Squares (scipy.stats.linregress)",
            x_variable="tree canopy cover (fraction, 0-1)",
            y_variable="modeled 2m air temperature (°C)",
            n_observations=len(x),
            slope_per_unit=round(res.slope, 3),
            r_squared=round(res.rvalue ** 2, 4),
            p_value=res.pvalue if res.pvalue > 1e-300 else 1e-300,
            interpretation=(
                f"Across the pooled modeled mesh, a +10 percentage-point increase in canopy cover is "
                f"associated with {abs(res.slope) * 0.1:.2f}°C lower modeled 2m temperature "
                f"(slope = {res.slope:.2f}°C per unit canopy)."
            ),
            honesty_note=(
                "This regression is fit on SHADE's DETERMINISTIC MODELED microclimate mesh — it validates "
                "the modeled heat-canopy gradient, not measured health outcomes. Health projections below "
                "use literature-anchored transfer coefficients and are explicitly not SHADE-fitted regressions."
            ),
        )
    except Exception as e:
        logger.error("temp-canopy OLS failed: %s", e)
        return None


def _build_outcomes(avg_temp: float, avg_canopy: float, avg_svi: float) -> List[OutcomeCorrelation]:
    """
    Literature-anchored transfer coefficients applied to the district's modeled stats.
    These are transparent defaults for demonstration, NOT regressions fit by SHADE —
    the API labels each with `coefficient_basis` so no one can mistake them for
    empirical fits.
    """
    temp_excess = max(0.0, avg_temp - 40.0)
    impact_ed = round(8.0 + temp_excess * 1.05, 1)
    impact_transit = round(12.0 + (1.0 - avg_canopy) * 15.0, 1)
    impact_power = round(2.0 + temp_excess * 0.3, 1)

    return [
        OutcomeCorrelation(
            metric_name="Heat-Related Emergency Department (ED) Visits",
            coefficient_per_celsius=f"+{impact_ed}% ED visits per +1.0°C above 40°C (default transfer coefficient)",
            coefficient_basis="Literature-anchored default — pending calibration against MCDPH surveillance microdata; not a SHADE-fitted regression",
            projected_impact=f"At the modeled district average of {avg_temp}°C ({temp_excess:.1f}°C above the 40°C threshold), the default coefficient implies a materially elevated ED burden concentrated in high-SVI blocks.",
            description=(
                f"Proportional-response model: ED burden scales with exceedance above 40°C, modulated by district "
                f"SVI {round(avg_svi, 2)} (CDC/ATSDR SVI 2022 tract data)."
            ),
            maricopa_county_baseline="Hundreds of heat-associated deaths annually (645 confirmed in 2023 — a record); thousands of heat-associated ED visits and hospitalizations reported by county surveillance.",
            baseline_source="Maricopa County Department of Public Health, 2023 Heat-Associated Deaths Report (maricopa.gov/1858)"
        ),
        OutcomeCorrelation(
            metric_name="Pedestrian Transit-Wait Heat Stress",
            coefficient_per_celsius=f"+{impact_transit}% heat-distress incidents for unshaded waits > 15 min (default transfer coefficient)",
            coefficient_basis="Literature-anchored default — unshaded MRT routinely exceeds air temperature by 14-18°C in desert cities; not a SHADE-fitted regression",
            projected_impact=f"District canopy {round(avg_canopy * 100, 1)}% implies most transit stops receive minimal shade during the 3 PM peak.",
            description=(
                "Mean Radiant Temperature (MRT) at unshaded stops drives acute heat stress; canopy shade blocks the "
                "dominant direct-beam component."
            ),
            maricopa_county_baseline="645 annual heat-associated deaths (Maricopa County Medical Examiner, confirmed 2023)",
            baseline_source="Maricopa County Department of Public Health heat surveillance (maricopa.gov/1858)"
        ),
        OutcomeCorrelation(
            metric_name="Residential Peak Power Grid Strain",
            coefficient_per_celsius=f"+{impact_power} kW/household demand per +1.0°C ambient (default transfer coefficient)",
            coefficient_basis="Literature-anchored default — HVAC load-temperature response; not a SHADE-fitted regression",
            projected_impact=f"Low-albedo surfaces re-radiate heat into housing stock; modeled district average {avg_temp}°C sustains overnight HVAC load.",
            description="Air-conditioning demand rises non-linearly with ambient temperature during Phoenix summer peaks.",
            maricopa_county_baseline="Summer peak electricity demand records during June-July heat waves (APS/SRP system peaks)",
            baseline_source="Utility peak-load reporting during 2023-2024 Phoenix heat waves"
        ),
    ]


def _compute_roi(budget: float, avg_temp: float, avg_svi: float, total_elderly: int) -> HealthEconomicROI:
    """Delegates to the shared, documented ROI model (backend/analytics/health_econ.py)
    so /api/correlation and /api/agent always agree."""
    from backend.analytics.health_econ import compute_health_econ_roi
    roi = compute_health_econ_roi(budget, avg_temp, avg_svi, total_elderly)
    return HealthEconomicROI(**roi)


@router.get("/health-impact", response_model=CorrelationStudyResponse)
def get_health_correlation_study(
    district: str = Query("Maryvale", description="Target district name"),
    budget: float = Query(50000.0, description="Intervention budget in USD"),
    hour: float = Query(15.0, description="Hour of day for analysis")
):
    """
    Returns (1) a genuinely-fitted OLS regression on the modeled microclimate mesh,
    (2) literature-anchored health transfer coefficients (explicitly labeled),
    (3) a transparent, assumption-documented ROI model.
    """
    maryvale_stats = _compute_district_stats("Maryvale", hour)
    arcadia_stats = _compute_district_stats("Arcadia", hour)
    target_stats = maryvale_stats if district.lower() == "maryvale" else arcadia_stats

    validation = _compute_temp_canopy_regression(hour)
    if validation is None:
        validation = StatisticalValidation(
            method="unavailable", x_variable="canopy", y_variable="temp_2m",
            n_observations=0, slope_per_unit=0.0, r_squared=0.0, p_value=1.0,
            interpretation="Regression unavailable.", honesty_note="n/a")

    outcomes = _build_outcomes(target_stats["avg_temp"], target_stats["avg_canopy"], target_stats["avg_svi"])

    district_comparison = [
        DemographicInequity(
            district="Maryvale (Low Canopy / High SVI)",
            avg_temp_2m_c=maryvale_stats["avg_temp"],
            tree_canopy_pct=round(maryvale_stats["avg_canopy"] * 100, 1),
            tree_canopy_source="City of Phoenix published neighborhood canopy (7.7%) — see data/canopy/SOURCE.md",
            svi_score=maryvale_stats["avg_svi"],
            svi_source="CDC/ATSDR SVI 2022, tract 04013109401 = 0.9398 (nearest-centroid lookup)",
            heat_er_admissions_per_100k="modeled — see outcomes[0] coefficient basis (no tract-level ED data published)",
            annual_heat_mortality_rate="county-wide: 645 heat-associated deaths confirmed in 2023 (MCDPH)",
        ),
        DemographicInequity(
            district="Arcadia (Affluent / High Canopy Control)",
            avg_temp_2m_c=arcadia_stats["avg_temp"],
            tree_canopy_pct=round(arcadia_stats["avg_canopy"] * 100, 1),
            tree_canopy_source="City top-tier canopy estimate (25%) — see data/canopy/SOURCE.md",
            svi_score=arcadia_stats["avg_svi"],
            svi_source="CDC/ATSDR SVI 2022, tract 04013108000 = 0.0116 (nearest-centroid lookup)",
            heat_er_admissions_per_100k="modeled — see outcomes[0] coefficient basis (no tract-level ED data published)",
            annual_heat_mortality_rate="county-wide: 645 heat-associated deaths confirmed in 2023 (MCDPH)",
        ),
    ]

    roi_summary = _compute_roi(
        budget, target_stats["avg_temp"], target_stats["avg_svi"], target_stats["total_elderly"]
    )

    return CorrelationStudyResponse(
        statistical_validation=validation,
        outcomes=outcomes,
        district_comparison=district_comparison,
        roi_summary=roi_summary
    )
