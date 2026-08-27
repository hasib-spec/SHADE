import math
import uuid
from typing import List, Dict, Any, Optional

def generate_synthetic_grid(district_name: str, hour: float = 15.0) -> List[Dict[str, Any]]:
    """
    Generates a realistic synthetic grid of 20m x 20m cells for specific Phoenix districts.
    
    Districts supported:
    - "Maryvale": Low canopy, high SVI, high poverty, low albedo, higher temp.
    - "Arcadia": High canopy, low SVI, high albedo, lower temp.
    
    Args:
        district_name (str): The name of the district to generate.
        hour (float): Hour of the day (0-24) to simulate diurnal temperature curve.
        
    Returns:
        List[Dict[str, Any]]: List of generated cell dictionaries.
    """
    cells = []
    
    if district_name.lower() == "maryvale":
        center_lat = 33.4942
        center_lon = -112.1771
        canopy_range = (0.04, 0.08)
        svi_range = (0.82, 0.96)
        albedo_base = 0.12
        base_temp_min, base_temp_max = 42.0, 45.0
        grid_size = 20  # 20x20 = 400 cells
    elif district_name.lower() == "arcadia":
        center_lat = 33.4980
        center_lon = -111.9540
        canopy_range = (0.25, 0.40)
        svi_range = (0.10, 0.25)
        albedo_base = 0.28
        base_temp_min, base_temp_max = 37.0, 39.0
        grid_size = 20
    else:
        # Default fallback
        center_lat = 33.45
        center_lon = -112.0
        canopy_range = (0.10, 0.20)
        svi_range = (0.4, 0.6)
        albedo_base = 0.15
        base_temp_min, base_temp_max = 40.0, 42.0
        grid_size = 20

    # 1 degree lat is ~ 111,111 meters
    # 20m is ~ 0.00018 degrees
    cell_deg_lat = 20.0 / 111111.0
    cell_deg_lon = 20.0 / (111111.0 * math.cos(math.radians(center_lat)))
    
    A = 5.0 # amplitude
    
    import random
    random.seed(hash(district_name))
    
    start_lat = center_lat - (grid_size/2) * cell_deg_lat
    start_lon = center_lon - (grid_size/2) * cell_deg_lon
    
    for i in range(grid_size):
        for j in range(grid_size):
            cell_lat = start_lat + i * cell_deg_lat
            cell_lon = start_lon + j * cell_deg_lon
            
            canopy = random.uniform(*canopy_range)
            svi = random.uniform(*svi_range)
            albedo = max(0.05, min(0.95, albedo_base + random.uniform(-0.05, 0.05)))
            aspect_ratio = random.uniform(0.5, 2.0)
            
            base_temp = random.uniform(base_temp_min, base_temp_max)
            
            mod_canopy = -(canopy * 3.5)
            mod_albedo = -((albedo - 0.15) * 4.0)
            mod_aspect = (aspect_ratio * 1.2)
            
            t_base_modified = base_temp + mod_canopy + mod_albedo + mod_aspect
            
            temp_2m = t_base_modified + A * math.sin(2 * math.pi * (hour - 9) / 24)
            surface_temp = temp_2m + random.uniform(2.0, 10.0)
            
            polygon = [
                [cell_lon, cell_lat],
                [cell_lon + cell_deg_lon, cell_lat],
                [cell_lon + cell_deg_lon, cell_lat + cell_deg_lat],
                [cell_lon, cell_lat + cell_deg_lat],
                [cell_lon, cell_lat]
            ]
            
            cells.append({
                "id": str(uuid.uuid4()),
                "polygon": polygon,
                "lat": cell_lat + cell_deg_lat/2,
                "lon": cell_lon + cell_deg_lon/2,
                "temp_2m": round(temp_2m, 2),
                "surface_temp": round(surface_temp, 2),
                "albedo": round(albedo, 2),
                "aspect_ratio": round(aspect_ratio, 2),
                "humidity": round(random.uniform(10.0, 25.0), 2),
                "wind_speed": round(random.uniform(0.5, 3.5), 2),
                "canopy_cover": round(canopy, 2),
                "svi": round(svi, 2),
                "population_density": round(random.uniform(500, 5000), 2),
                "elderly_density": round(random.uniform(50, 1000), 2),
                "children_density": round(random.uniform(100, 1200), 2),
                "outdoor_worker_density": round(random.uniform(10, 300), 2),
                "transit_stop_distance_m": round(random.uniform(10, 2000), 2),
            })
            
    return cells

class SyntheticGridGenerator:
    @staticmethod
    def get_district_grid(district_name: str, hour: float = 15.0) -> List[Dict[str, Any]]:
        return generate_synthetic_grid(district_name, hour)
