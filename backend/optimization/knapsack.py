from typing import List, Dict, Any, Optional
import math
from backend.schemas.optimization import AllocationPlan, AllocationItem
from backend.schemas.intervention import InterventionType
from backend.optimization.overlap import calculate_spatial_overlap_penalty
from backend.inference.surrogate_model import InterventionSurrogateModel

# Dummy cost mapping for this example
INTERVENTION_COSTS = {
    InterventionType.tree_canopy: 500.0,
    InterventionType.shade_structure: 3000.0,
    InterventionType.cool_pavement: 1500.0,
    InterventionType.misting: 2500.0
}

class BudgetKnapsackSolver:
    """
    Advanced spatial knapsack optimizer for intervention allocation.
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
        
        # Track selected locations for overlap penalties
        selected_locations: List[Dict[str, Any]] = []
        
        # Precompute base cooling deltas
        candidates = []
        for cell in hotspot_cells:
            env_features = {
                'canopy_density': cell.get('canopy_cover', 0.1),
                'surface_albedo': cell.get('albedo', 0.2),
                'aspect_ratio': cell.get('aspect_ratio', 1.0),
                'humidity': cell.get('humidity', 30.0),
                'wind_speed': cell.get('wind_speed', 2.0),
                'base_temp': cell.get('temp_2m', 35.0)
            }
            
            for inv_type in allowed_interventions:
                cost = INTERVENTION_COSTS.get(inv_type, 1000.0)
                if cost > total_budget:
                    continue
                
                # Evaluate intervention
                result = self.surrogate_model.evaluate_intervention(inv_type, env_features)
                cooling_delta_val = result['cooling_delta'].delta_t_air
                
                # We want maximum negative delta, so score is positive
                abs_cooling = abs(cooling_delta_val)
                
                # Calculate marginal CES (Cooling Equity Score) - simple heuristic here
                residents = cell.get('population_density', 100)
                vuln_multiplier = cell.get('heri_score', 1.0)
                
                ces = (abs_cooling * residents * vuln_multiplier) / cost
                
                candidates.append({
                    'cell_id': cell['id'],
                    'intervention_type': inv_type,
                    'cost': cost,
                    'cooling_delta': cooling_delta_val,
                    'residents_covered': int(residents),
                    'ces': ces,
                    'lat': cell['lat'],
                    'lon': cell['lon']
                })
        
        # Iteratively select best candidates
        while candidates and budget_spent < total_budget:
            # Sort candidates by CES descending
            candidates.sort(key=lambda x: x['ces'], reverse=True)
            
            best_candidate = None
            for cand in candidates:
                if budget_spent + cand['cost'] <= total_budget:
                    best_candidate = cand
                    break
            
            if not best_candidate:
                break
                
            # Add to allocated items
            allocated_items.append(AllocationItem(
                cell_id=best_candidate['cell_id'],
                intervention_type=best_candidate['intervention_type'],
                cost=best_candidate['cost'],
                cooling_delta=best_candidate['cooling_delta'],
                residents_covered=best_candidate['residents_covered']
            ))
            budget_spent += best_candidate['cost']
            selected_locations.append(best_candidate)
            
            # Remove chosen candidate from pool
            candidates = [c for c in candidates if not (c['cell_id'] == best_candidate['cell_id'] and c['intervention_type'] == best_candidate['intervention_type'])]
            
            # Apply spatial overlap penalty to remaining candidates
            for cand in candidates:
                dist = self._calculate_distance(best_candidate, cand)
                penalty = calculate_spatial_overlap_penalty(dist)
                cand['ces'] *= penalty
                
        # Calculate summary metrics
        total_residents = sum(item.residents_covered for item in allocated_items)
        avg_cooling = sum(item.cooling_delta for item in allocated_items) / len(allocated_items) if allocated_items else 0.0
        
        return AllocationPlan(
            items=allocated_items,
            total_cost=budget_spent,
            total_residents_covered=total_residents,
            avg_projected_delta_t=avg_cooling
        )
