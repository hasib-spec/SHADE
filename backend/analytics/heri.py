import math
from typing import List, Dict, Any

def calculate_heri(cells: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Calculates the Heat Equity Risk Index (HERI) for a list of cells.
    
    Formula: HERI_i = [(T_2m,i - T_bar_district) / sigma_T] * SVI_i * (1 - C_i)
    Normalizes to 0-100 scale.
    """
    if not cells:
        return []

    # Calculate district mean and std deviation for temperature
    temps = [c["temp_2m"] for c in cells]
    t_bar = sum(temps) / len(temps)
    variance = sum((t - t_bar) ** 2 for t in temps) / len(temps)
    sigma_t = math.sqrt(variance) if variance > 0 else 1.0

    raw_heri_scores = []
    
    for c in cells:
        t_2m = c.get("temp_2m", t_bar)
        svi = c.get("svi", 0.5)
        canopy = c.get("canopy_cover", 0.0)
        
        z_score = (t_2m - t_bar) / sigma_t
        
        # Shift Z to avoid large negatives throwing off the risk index entirely.
        raw_heri = max(0, z_score + 3) * svi * (1.0 - canopy) 
        raw_heri_scores.append(raw_heri)

    if not raw_heri_scores:
        return cells

    max_heri = max(raw_heri_scores)
    min_heri = min(raw_heri_scores)
    range_heri = max_heri - min_heri if max_heri > min_heri else 1.0

    enriched_cells = []
    for i, c in enumerate(cells):
        raw = raw_heri_scores[i]
        # Normalize to 0-100
        heri_normalized = ((raw - min_heri) / range_heri) * 100.0
        
        if heri_normalized >= 80:
            risk_level = "CRITICAL"
        elif heri_normalized >= 60:
            risk_level = "HIGH"
        elif heri_normalized >= 40:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"
            
        svi = c.get("svi", 0.5)
        elderly = c.get("elderly_density", 0)
        pop = c.get("population_density", 0)
        transit = c.get("transit_stop_distance_m", 0)
        
        # Vulnerability combination
        vulnerable_ratio = svi * 0.5 + (elderly / pop if pop > 0 else 0) * 0.3 + (min(transit, 2000)/2000.0) * 0.2
        affected_vulnerable = int(pop * vulnerable_ratio)
        
        enriched = c.copy()
        enriched.update({
            "z_score": round((c.get("temp_2m", t_bar) - t_bar) / sigma_t, 3),
            "canopy_factor": round(1.0 - c.get("canopy_cover", 0), 3),
            "heri_score": round(heri_normalized, 2),
            "risk_level": risk_level,
            "affected_vulnerable_residents": affected_vulnerable
        })
        enriched_cells.append(enriched)
        
    return enriched_cells
