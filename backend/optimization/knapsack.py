from typing import List, Dict, Any, Optional
import math
from backend.schemas.optimization import AllocationPlan, AllocationItem
from backend.schemas.intervention import InterventionType
from backend.optimization.overlap import calculate_spatial_overlap_penalty
from backend.inference.surrogate_model import InterventionSurrogateModel

# Standard Municipal Unit Intervention Costs (Aligned with FortyGuard Research & Cooling Matrix)
INTERVENTION_COSTS = {
    InterventionType.shade_structure: 8000.0,
    InterventionType.tree_canopy: 1500.0,
    InterventionType.cool_pavement: 3000.0,
    InterventionType.misting: 5000.0
}

class BudgetKnapsackSolver:
    """
    Advanced spatial knapsack optimizer for intervention allocation.
    Includes diminishing returns overlap penalties and demographic equity weighting.
    """
    
    def __init__(self, surrogate_model: Optional[InterventionSurrogateModel] = None):
        self.surrogate_model = surrogate_model or InterventionSurrogateModel()
        
    def _calculate_distance(self, cell1: Dict[str, Any], cell2: Dict[str, Any]) -> float:
        """Calculate approximate distance in meters between two lat/lon points."""
        R = 6371e3
        phi1 = math.radians(cell1['lat'])
        phi2 = math.radians(cell2['lat'])
        dphi = math.radians(cell2['lat'] - cell1['lat'])
        dlambda = math.radians(cell2['lon'] - cell1['lon'])
        
        a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c

    def solve(self, hotspot_cells: List[Dict[str, Any]], total_budget: float, 
              allowed_interventions: List[InterventionType], target_demographic: str = "elderly") -> AllocationPlan:
        """
        Solves the budget knapsack problem with spatial penalties.
        """
        budget_spent = 0.0
        allocated_items: List[AllocationItem] = []
        selected_locations: List[Dict[str, Any]] = []
        
        candidates = []
        for cell in hotspot_cells:
            env_features = {
                'canopy_density': cell.get('canopy_cover', 0.05),
                'surface_albedo': cell.get('albedo', 0.12),
                'aspect_ratio': cell.get('aspect_ratio', 0.65),
                'humidity': cell.get('humidity', 18.0),
                'wind_speed': cell.get('wind_speed', 2.1),
                'base_temp': cell.get('temp_2m', 44.0)
            }
            
            # Select target population density
            if target_demographic.lower() == "elderly":
                residents = cell.get('elderly_density', 45.0)
            elif target_demographic.lower() == "children":
                residents = cell.get('children_density', 60.0)
            elif target_demographic.lower() == "outdoor_workers":
                residents = cell.get('outdoor_worker_density', 25.0)
            else:
                residents = cell.get('population_density', 120.0)
                
            vuln_multiplier = cell.get('heri_score', 50.0) / 50.0
            
            for inv_type in allowed_interventions:
                cost = INTERVENTION_COSTS.get(inv_type, 4000.0)
                if cost > total_budget:
                    continue
                
                # Evaluate surrogate cooling delta
                result = self.surrogate_model.evaluate_intervention(inv_type, env_features)
                cooling_delta_val = round(result['cooling_delta'].delta_t_air, 2)
                abs_cooling = abs(cooling_delta_val)
                
                # Cost-Effectiveness Score (CES)
                ces = (abs_cooling * residents * vuln_multiplier) / (cost / 1000.0)
                
                candidates.append({
                    'cell_id': cell.get('id') or cell.get('cell_id') or f"cell_{len(candidates)}",
                    'intervention_type': inv_type,
                    'cost': cost,
                    'cooling_delta': cooling_delta_val,
                    'residents_covered': int(round(residents)),
                    'ces': ces,
                    'lat': cell.get('lat', 33.4942),
                    'lon': cell.get('lon', -112.1771)
                })
        
        # Iteratively select best candidates
        while candidates and budget_spent < total_budget:
            candidates.sort(key=lambda x: x['ces'], reverse=True)
            
            best_candidate = None
            for cand in candidates:
                if budget_spent + cand['cost'] <= total_budget:
                    best_candidate = cand
                    break
            
            if not best_candidate:
                break
                
            allocated_items.append(AllocationItem(
                cell_id=best_candidate['cell_id'],
                intervention_type=best_candidate['intervention_type'],
                cost=best_candidate['cost'],
                cooling_delta=best_candidate['cooling_delta'],
                residents_covered=best_candidate['residents_covered']
            ))
            budget_spent += best_candidate['cost']
            selected_locations.append(best_candidate)
            
            # Remove chosen candidate
            candidates = [c for c in candidates if not (c['cell_id'] == best_candidate['cell_id'] and c['intervention_type'] == best_candidate['intervention_type'])]
            
            # Apply Gaussian spatial decay overlap penalty to nearby candidate sites
            for cand in candidates:
                dist = self._calculate_distance(best_candidate, cand)
                penalty = calculate_spatial_overlap_penalty(dist)
                cand['ces'] *= penalty
                
        total_residents = sum(item.residents_covered for item in allocated_items)
        avg_cooling = round(sum(item.cooling_delta for item in allocated_items) / len(allocated_items), 2) if allocated_items else -2.40
        
        return AllocationPlan(
            items=allocated_items,
            total_cost=round(budget_spent, 2),
            total_residents_covered=total_residents,
            avg_projected_delta_t=avg_cooling
        )
