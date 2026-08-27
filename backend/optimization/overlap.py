import math

def calculate_spatial_overlap_penalty(dist: float, sigma: float = 25.0) -> float:
    """
    Calculates diminishing returns using a Gaussian spatial kernel when multiple 
    cooling interventions are placed near each other.
    
    Args:
        dist: Distance between the new intervention and an existing one in meters.
        sigma: Spread of the Gaussian spatial kernel in meters.
        
    Returns:
        float: Spatial overlap penalty (multiplier between 0 and 1)
    """
    if dist < 50.0:
        penalty = 1.0 - 0.45 * math.exp(- (dist**2) / (2 * (sigma**2)))
        return penalty
    return 1.0
