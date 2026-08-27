from typing import List, Dict, Any

def calculate_aps(cells: List[Dict[str, Any]], target_demographic: str = "general") -> List[Dict[str, Any]]:
    """
    Calculates Action Priority Score (APS) for interventions.
    Formula: APS_i,k = HERI_i * P_i * DeltaT_2m,k
    """
    
    interventions = {
        "shade_structure": 2.0,
        "tree_canopy": 2.5,
        "cool_pavement": 0.9,
        "misting": 4.0
    }
    
    results = []
    
    for c in cells:
        heri = c.get("heri_score", 0.0)
        pop = c.get("population_density", 1.0)
        
        if target_demographic == "elderly":
            weight = c.get("elderly_density", 0.0) / pop if pop > 0 else 0
            p_factor = pop * (1.0 + weight)
        elif target_demographic == "children":
            weight = c.get("children_density", 0.0) / pop if pop > 0 else 0
            p_factor = pop * (1.0 + weight)
        elif target_demographic == "outdoor_worker":
            weight = c.get("outdoor_worker_density", 0.0) / pop if pop > 0 else 0
            p_factor = pop * (1.0 + weight)
        else:
            p_factor = pop
            
        aps_scores = {}
        for k, delta_t in interventions.items():
            aps_scores[k] = round(heri * p_factor * delta_t, 2)
            
        enriched = c.copy()
        enriched["aps"] = aps_scores
        results.append(enriched)
        
    return results
