from typing import List, Dict, Any

def calculate_ces(cells: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Calculates Cost-Effectiveness Score (CES).
    Formula: CES_i,k = APS_i,k / Cost_k
    Returns ranked opportunities.
    """
    costs = {
        "shade_structure": 8000.0,
        "tree_canopy": 1500.0,
        "cool_pavement": 3000.0,
        "misting": 5000.0
    }
    
    opportunities = []
    
    for c in cells:
        aps_scores = c.get("aps", {})
        for intervention, aps_val in aps_scores.items():
            cost = costs.get(intervention, 999999)
            ces_val = aps_val / cost
            
            opportunities.append({
                "cell_id": c.get("id"),
                "lat": c.get("lat"),
                "lon": c.get("lon"),
                "intervention_type": intervention,
                "aps_score": aps_val,
                "cost": cost,
                "ces_score": round(ces_val, 4)
            })
            
    # Rank by CES descending
    opportunities.sort(key=lambda x: x["ces_score"], reverse=True)
    return opportunities
