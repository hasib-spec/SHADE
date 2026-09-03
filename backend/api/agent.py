"""
SHADE Agent Chat API
Routes LLM conversation through Google Gemini with real-time FortyGuard context.
Equipped with autonomous global geocoding, live meteorological APIs, dynamic budget extraction,
spatial knapsack optimization, and ROI analytics.
"""
from fastapi import APIRouter
from typing import Optional, Dict, Any, List
import logging
import re
from backend.schemas.agent import ChatRequest, AgentResponse, AgentMessage
from backend.agent.graph import shade_agent
from backend.agent.nim_client import invoke_nim_chat
from backend.agent.prompts import SHADE_SYSTEM_PROMPT
from backend.data.synthetic_grid import SyntheticGridGenerator
from backend.analytics.heri import calculate_heri
from backend.analytics.health_econ import compute_health_econ_roi
from backend.optimization.knapsack import BudgetKnapsackSolver
from backend.schemas.intervention import InterventionType
from backend.data.global_geocoder import (
    extract_location_from_query,
    fetch_live_hyperlocal_weather,
    generate_global_20m_grid
)

router = APIRouter(prefix="/api/agent", tags=["agent"])
logger = logging.getLogger(__name__)

solver = BudgetKnapsackSolver()

def _extract_dynamic_budget(query: str, response_text: str, default_budget: float = 50000.0) -> float:
    """
    Intelligently extracts the exact dollar budget from user query or AI response.
    Supports formatted currency ($250,000, $14,700, $9,900, $50k, 100k, $1.5M).
    """
    text_to_search = f"{query} {response_text}"
    
    total_patterns = [
        r'(?:TOTAL|Total|Budget|Allocation|Plan|invest|Invest|cost|Cost)\s*[:=]?\s*\$([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]+)?|\d+)',
        r'\$([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]+)?)',
        r'\$([0-9]+(?:\.[0-9]+)?)\s*(?:k|thousand|K)\b',
        r'(\d+)\s*(?:k|thousand|K)\b',
        r'\$([0-9]+(?:\.[0-9]+)?)\s*(?:m|million|M)\b'
    ]
    
    for pat in total_patterns:
        matches = re.findall(pat, text_to_search, re.IGNORECASE)
        if matches:
            for match in matches:
                try:
                    clean_val = str(match).replace(',', '').strip()
                    val = float(clean_val)
                    if 'k' in pat or 'thousand' in pat:
                        val *= 1000.0
                    elif 'm' in pat or 'million' in pat:
                        val *= 1000000.0
                    if 1000.0 <= val <= 10000000.0:
                        return val
                except ValueError:
                    continue

    return default_budget

def _build_location_context(location_info: Dict[str, Any], wx_data: Dict[str, Any], cells: List[Dict[str, Any]]) -> str:
    """
    Builds structured meteorological and spatial context from live API readings.
    """
    temps = [c.get("temp_2m", wx_data["temp_2m"]) for c in cells]
    svis = [c.get("svi", location_info.get("svi", 0.85)) for c in cells]
    canopies = [c.get("canopy_cover", location_info.get("canopy", 0.05)) for c in cells]
    elderly = [c.get("elderly_density", 45) for c in cells]

    avg_temp = sum(temps) / len(temps) if temps else wx_data["temp_2m"]
    max_temp = max(temps) if temps else wx_data["temp_2m"] + 3.0
    avg_svi = sum(svis) / len(svis) if svis else 0.85
    avg_canopy = sum(canopies) / len(canopies) if canopies else 0.05
    total_elderly = sum(elderly) if elderly else 0
    critical_cells = sum(1 for t in temps if t >= 40.0)

    return (
        f"\n[LIVE GROUND-TRUTH TELEMETRY & SPATIAL CONTEXT]\n"
        f"Target Location: {location_info['name']}\n"
        f"Exact GPS Coordinates: {location_info['lat']:.5f}° N, {location_info['lon']:.5f}° E\n"
        f"Live 2m Air Temp (Open-Meteo): {wx_data['temp_2m']}°C\n"
        f"Live Surface Temp: {wx_data['surface_temp']}°C\n"
        f"Relative Humidity: {wx_data['humidity']}% | Wind Speed: {wx_data['wind_speed']} km/h\n"
        f"Telemetry Source: {wx_data['source']}\n"
        f"20m² Microclimate Mesh: {len(cells)} cells (DETERMINISTIC MODELED BASELINE — data_provenance='modeled'; "
        f"temperatures are physics-modeled, not measured)\n"
        f"Grid Avg 2m Temp: {avg_temp:.1f}°C | Hotspot Peak: {max_temp:.1f}°C\n"
        f"Critical High-Risk Cells (>=40°C): {critical_cells}/{len(cells)}\n"
        f"Social Vulnerability Index (SVI): {avg_svi:.2f} "
        f"({'CDC/ATSDR SVI 2022 tract data (nearest-centroid)' if not location_info.get('is_global', False) else 'MODELED BASELINE — not measured data'})\n"
        f"Tree Canopy Cover: {avg_canopy*100:.1f}%\n"
        f"Estimated Vulnerable Population (modeled density field): {int(total_elderly):,} residents\n"
        f"IMPORTANT: Quote only the numbers above and clearly attribute modeled values as modeled.\n"
    )

def _work_order_id(location_name: str) -> str:
    """Deterministic, date-based work-order identifier (replaces the previously
    hardcoded 'WO-PHX-2026-0829-01', which implied a municipal numbering system
    that does not exist)."""
    slug = re.sub(r"[^a-z0-9]+", "", location_name.split(",")[0].lower())[:4].upper() or "PLAN"
    return f"WO-{slug}-{__import__('datetime').date.today().strftime('%Y%m%d')}-01"

def _generate_allocation_artifacts(
    location_info: Dict[str, Any],
    wx_data: Dict[str, Any],
    cells: List[Dict[str, Any]],
    query: str,
    response_text: str
) -> Dict[str, Any]:
    """
    Computes dynamic spatial allocation plan, geojson beacons, and ROI analytics for ANY global location.
    """
    query_lower = query.lower()
    resp_lower = response_text.lower()
    
    is_allocation = any(w in query_lower or w in resp_lower for w in [
        "allocate", "budget", "plan", "invest", "roi", "deploy", "dispatch", "intervention", "work order", "42nd", "55th", "misting", "shade", "pavement", "$", "check", "find"
    ])
    
    enriched = calculate_heri(cells) if cells else []
    critical_count = sum(1 for c in (enriched or []) if c.get("heri_score", 0) > 80 or c.get("temp_2m", 0) >= 40.0)
    dynamic_budget = _extract_dynamic_budget(query, response_text, default_budget=50000.0)

    # Sort candidates by HERI descending
    enriched.sort(key=lambda c: c.get("heri_score", 0.0), reverse=True)
    hotspots = enriched[:50]
    
    plan = solver.solve(
        hotspot_cells=hotspots,
        total_budget=dynamic_budget,
        allowed_interventions=list(InterventionType),
        target_demographic="elderly"
    )
    
    # Build list of intervention markers with exact cell lat/lon
    interventions = []
    for item in plan.items:
        matching_cell = next((c for c in enriched if c.get("id") == item.cell_id or c.get("cell_id") == item.cell_id), None)
        lat = matching_cell.get("lat", location_info["lat"]) if matching_cell else location_info["lat"]
        lon = matching_cell.get("lon", location_info["lon"]) if matching_cell else location_info["lon"]
        interventions.append({
            "cell_id": item.cell_id,
            "intervention_type": str(item.intervention_type.value if hasattr(item.intervention_type, 'value') else item.intervention_type),
            "cost": item.cost,
            "cooling_delta": item.cooling_delta,
            "residents_covered": item.residents_covered,
            "lat": lat,
            "lon": lon
        })
        
    # Real grid statistics for the transparent shared ROI model.
    temps_all = [c.get("temp_2m", 42.0) for c in enriched]
    svis_all = [c.get("svi", 0.5) for c in enriched]
    elderly_all = [c.get("elderly_density", 0) for c in enriched]
    avg_temp = sum(temps_all) / len(temps_all) if temps_all else 42.0
    avg_svi = sum(svis_all) / len(svis_all) if svis_all else 0.5
    total_elderly = int(sum(elderly_all)) if elderly_all else 0
    roi = compute_health_econ_roi(dynamic_budget, avg_temp, avg_svi, total_elderly)

    return {
        "status": "ALLOCATED",
        "district": location_info["name"].split(",")[0],
        "location_meta": {
            "name": location_info["name"],
            "lat": location_info["lat"],
            "lon": location_info["lon"],
            "zoom": 15.5,
            "live_temp_2m": wx_data["temp_2m"],
            "live_surface_temp": wx_data["surface_temp"],
            "live_humidity": wx_data["humidity"],
            "source": wx_data["source"]
        },
        "grid_cells": enriched,
        "budget_spent": round(plan.total_cost, 2),
        "residents_covered": plan.total_residents_covered,
        "avg_cooling_c": round(plan.avg_projected_delta_t, 2),
        "work_order_id": _work_order_id(location_info["name"]),
        "interventions": interventions,
        "cells_analyzed": len(cells),
        "critical_cells": critical_count,
        "data_provenance": "modeled" if not location_info.get("is_global") else "live_weather+modeled_grid",
        "roi_metrics": {
            "bcr_multiplier": f"{roi['benefit_cost_ratio']:.2f}x",
            "estimated_healthcare_savings_usd": roi["direct_medical_cost_savings_usd"],
            "emergency_admissions_avoided": roi["projected_hospital_visits_avoided"],
            "net_economic_benefit_usd": roi["net_economic_benefit_usd"],
            "is_modeled_estimate": True,
            "methodology": "Transparent arithmetic model over literature-anchored default coefficients (backend/analytics/health_econ.py). Modeled estimate, not an empirical measurement."
        }
    }

@router.post("/chat", response_model=AgentResponse)
def agent_chat(request: ChatRequest):
    """
    Runs the SHADE Agent with live Gemini AI reasoning, real-time geocoding, 
    and live global meteorological sensor synchronization.
    """
    latest_message = ""
    messages_payload = []

    if request.messages and len(request.messages) > 0:
        messages_payload = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        latest_message = request.messages[-1].content
    elif request.message:
        latest_message = request.message
        messages_payload = [{"role": "user", "content": request.message}]
    elif request.content:
        latest_message = request.content
        messages_payload = [{"role": "user", "content": request.content}]
    elif request.query:
        latest_message = request.query
        messages_payload = [{"role": "user", "content": request.query}]

    if not latest_message:
        return AgentResponse(
            response="Please provide a question about heat vulnerability, cooling interventions, or district analysis.",
            artifacts={}
        )

    # 1. Real-World Geocoding Detection
    loc = extract_location_from_query(latest_message)
    if not loc:
        loc = {
            "name": "Maryvale, Phoenix, AZ",
            "lat": 33.4942,
            "lon": -112.1771,
            "svi": 0.94,
            "canopy": 0.058,
            "is_global": False
        }

    # 2. Real Live Meteorological Data Fetch (Open-Meteo / WMO / FortyGuard)
    wx_data = fetch_live_hyperlocal_weather(loc["lat"], loc["lon"])

    # 3. Generate High-Precision 20m² Microclimate Grid
    if loc.get("is_global", False):
        cells = generate_global_20m_grid(
            center_lat=loc["lat"],
            center_lon=loc["lon"],
            location_name=loc["name"],
            base_temp_2m=wx_data["temp_2m"],
            base_humidity=wx_data["humidity"],
            svi_baseline=loc.get("svi", 0.85),
            canopy_baseline=loc.get("canopy", 0.05)
        )
    else:
        # Standard pilot district
        d_name = "Arcadia" if "arcadia" in loc["name"].lower() else "Maryvale"
        cells = SyntheticGridGenerator.get_district_grid(d_name, hour=15.0)

    # 4. Build Verified Ground-Truth Context for Gemini
    ground_truth_context = _build_location_context(loc, wx_data, cells)
    enriched_system_prompt = SHADE_SYSTEM_PROMPT + ground_truth_context

    # 5. Primary: Live Gemini AI Reasoning
    try:
        response_text = invoke_nim_chat(
            messages=messages_payload,
            system_prompt=enriched_system_prompt,
            fallback_response=None
        )

        if response_text and len(response_text.strip()) > 10:
            artifacts = _generate_allocation_artifacts(loc, wx_data, cells, latest_message, response_text)
            return AgentResponse(
                response=response_text,
                artifacts=artifacts
            )
    except Exception as e:
        logger.error(f"Gemini AI call failed: {e}")

    # 6. Fallback: Rule-based Decision pipeline
    try:
        result = shade_agent.run(
            messages=messages_payload,
            district=loc["name"].split(",")[0],
            budget=_extract_dynamic_budget(latest_message, "", 50000.0),
            target="elderly"
        )
        artifacts = _generate_allocation_artifacts(loc, wx_data, cells, latest_message, result.get("response", ""))
        return AgentResponse(
            response=result.get("response", "Analysis completed."),
            artifacts=artifacts
        )
    except Exception as e:
        logger.error(f"Agent pipeline also failed: {e}")
        return AgentResponse(
            response=f"I encountered an error processing your request for {loc['name']}. Error: {str(e)}",
            artifacts={"status": "ERROR", "error": str(e)}
        )
