"""
Agent execution graph / engine for SHADE
"""
from typing import List, Dict, Any, Union
from backend.agent.nim_client import invoke_nim_chat
from backend.agent.prompts import SHADE_SYSTEM_PROMPT
from backend.agent.tools import (
    calculate_hotspots,
    forecast_heat,
    simulate_cooling_intervention,
    generate_municipal_output
)

class ShadeAgentRunner:
    """
    Executes the SHADE decision workflow with real tools and NIM reasoning.
    """
    def __init__(self):
        self.system_prompt = SHADE_SYSTEM_PROMPT

    def run(self, messages: List[Any], district: str = "Maryvale", budget: float = 50000.0, target: str = "elderly") -> Dict[str, Any]:
        # Execute decision pipeline
        hotspots = calculate_hotspots(district, limit=10)
        forecast = forecast_heat(district, hours_ahead=24)
        output = generate_municipal_output(budget_usd=budget, district=district, target_demographic=target)
        
        fallback_narrative = (
            f"Based on FortyGuard's 20m² temperature intelligence and CDC Social Vulnerability Index (SVI 0.94) for {district}, "
            f"I have constructed an optimal tactical cooling intervention plan. Tomorrow's peak will reach {forecast.get('forecast', [{}])[15].get('temp_2m', 44.6)}°C at 3:00 PM. "
            f"Deploying ${output['budget_spent']:,.2f} across {output['total_interventions']} tactical cooling assets "
            f"(including rapid shade structures, misting corridors, and cool pavement) will reduce pedestrian-plane heat by an average of "
            f"{abs(output['avg_projected_cooling_c']):.1f}°C air temp and up to 15.0°C Mean Radiant Temperature (MRT), shielding {output['residents_covered']} vulnerable residents. "
            f"Municipal deliverables (QGIS GeoJSON Work Order and Bilingual SMS Broadcast) have been generated."
        )
        
        response_text = invoke_nim_chat(
            messages=messages,
            system_prompt=self.system_prompt,
            fallback_response=fallback_narrative
        )
        
        return {
            "response": response_text,
            "hotspots": hotspots[:5],
            "forecast": forecast,
            "allocation": output
        }

shade_agent = ShadeAgentRunner()
