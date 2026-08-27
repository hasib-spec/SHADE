import datetime
from typing import List, Dict, Any, Union
from backend.schemas.optimization import AllocationPlan

def generate_geojson_workorder(plan: Union[AllocationPlan, Dict[str, Any]], grid_cells: List[Any] = None) -> dict:
    """
    Generates QGIS/ArcGIS compliant GeoJSON FeatureCollection for the allocated interventions.
    Works seamlessly with AllocationPlan objects or raw dictionary payloads.
    """
    if grid_cells is None:
        grid_cells = []
        
    cell_dict = {}
    for cell in grid_cells:
        cid = getattr(cell, "id", None) or (cell.get("id") if isinstance(cell, dict) else None)
        if cid:
            cell_dict[cid] = cell
            
    if isinstance(plan, dict):
        items = plan.get("items", [])
    elif hasattr(plan, "items"):
        items = plan.items
    else:
        items = []
    
    features = []
    
    for idx, item in enumerate(items):
        if isinstance(item, dict):
            cell_id = item.get("cell_id")
            inv_type_val = item.get("intervention_type", "shade_structure")
            cost = item.get("cost", 3000.0)
            cooling_delta = item.get("cooling_delta", -2.4)
            residents_covered = item.get("residents_covered", 100)
        else:
            cell_id = getattr(item, "cell_id", None)
            inv_type = getattr(item, "intervention_type", "shade_structure")
            inv_type_val = getattr(inv_type, "value", inv_type)
            cost = getattr(item, "cost", 3000.0)
            cooling_delta = getattr(item, "cooling_delta", -2.4)
            residents_covered = getattr(item, "residents_covered", 100)
            
        cell = cell_dict.get(cell_id) if cell_id else None
        
        if cell and isinstance(cell, dict) and "polygon" in cell:
            polygon = cell["polygon"]
        elif cell and hasattr(cell, "lat") and hasattr(cell, "lon"):
            lat, lon = cell.lat, cell.lon
            offset = 0.0001
            polygon = [
                [lon - offset, lat - offset],
                [lon + offset, lat - offset],
                [lon + offset, lat + offset],
                [lon - offset, lat + offset],
                [lon - offset, lat - offset]
            ]
        else:
            lat, lon = 33.4942 + (idx * 0.0005), -112.1771 + (idx * 0.0005)
            offset = 0.0001
            polygon = [
                [lon - offset, lat - offset],
                [lon + offset, lat - offset],
                [lon + offset, lat + offset],
                [lon - offset, lat + offset],
                [lon - offset, lat - offset]
            ]
            
        color_map = {
            "shade_structure": "#F59E0B",
            "tree_canopy": "#10B981",
            "cool_pavement": "#3B82F6",
            "misting": "#06B6D4"
        }
        
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [polygon]
            },
            "properties": {
                "work_order_id": f"WO-PHX-20260829-{idx+1:03d}",
                "contractor_task": f"Install {str(inv_type_val).replace('_', ' ').title()}",
                "intervention_type": str(inv_type_val),
                "estimated_cost_usd": float(cost),
                "projected_cooling_c": float(cooling_delta),
                "vulnerable_residents_covered": int(residents_covered),
                "priority_rank": idx + 1,
                "deployment_deadline_iso": (datetime.datetime.now() + datetime.timedelta(days=14)).isoformat(),
                "marker-color": color_map.get(str(inv_type_val), "#8B5CF6"),
                "stroke-width": 2,
                "fill-opacity": 0.6,
                "resolution_m2": 20,
                "measurement_plane_m": 2.0
            }
        }
        features.append(feature)
        
    return {
        "type": "FeatureCollection",
        "metadata": {
            "title": "SHADE Municipal Tactical Cooling Deployment Work Order",
            "district": "Maryvale, Phoenix AZ",
            "generated_at": datetime.datetime.now().isoformat(),
            "target_resolution": "20m²",
            "calibration_height": "2m (Pedestrian Plane)",
            "compliance": "QGIS / ArcGIS / FortyGuard Temperature Twin"
        },
        "features": features
    }
