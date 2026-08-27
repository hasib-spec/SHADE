import os
import joblib
import numpy as np
from typing import Dict, Any, List, Optional

from backend.schemas.intervention import CoolingDelta, InterventionType
from backend.inference.cooling_matrix import COOLING_MATRIX

class InterventionSurrogateModel:
    """
    High-speed inference engine for predicting intervention cooling impact.
    Attempts Joblib / ONNX neural surrogate execution, falling back to vectorized
    empirical micro-physics formulas matching the FortyGuard 20m² / 2m specification.
    """
    
    def __init__(self, model_path: str = None):
        self.model = None
        if model_path is None:
            # Check for trained surrogate model
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            possible_paths = [
                os.path.join(base_dir, 'models', 'surrogate', 'surrogate_model.joblib'),
                os.path.join(base_dir, 'models', 'triton_repo', 'intervention_surrogate', '1', 'model.joblib')
            ]
            for p in possible_paths:
                if os.path.exists(p):
                    model_path = p
                    break
                    
        if model_path and os.path.exists(model_path):
            try:
                self.model = joblib.load(model_path)
            except Exception as e:
                self.model = None
                
    def _get_empirical_cooling(self, intervention: InterventionType, env_features: Dict[str, float]) -> float:
        """
        Fallback empirical physics formulas for cooling delta (at 2m pedestrian level).
        """
        canopy = env_features.get('canopy_density', 0.1)
        albedo = env_features.get('surface_albedo', 0.2)
        aspect = env_features.get('aspect_ratio', 1.0)
        humidity = env_features.get('humidity', 30.0)
        base_temp = env_features.get('base_temp', 35.0)
        
        if intervention == InterventionType.tree_canopy:
            return -(1.0 + 2.8 * canopy - 0.02 * humidity + 0.05 * base_temp / 40.0)
        elif intervention == InterventionType.shade_structure:
            return -(1.5 + 1.0 * (1.0 - albedo) + 0.3 * aspect)
        elif intervention == InterventionType.cool_pavement:
            return -(0.6 + 0.6 * (0.4 - albedo) * 2.0)
        elif intervention == InterventionType.misting:
            return -(3.0 + 2.0 * (1.0 - humidity / 100.0) * (base_temp / 40.0))
        return -1.5

    def predict(self, intervention: InterventionType, env_features: Dict[str, float]) -> CoolingDelta:
        """
        Predict the cooling delta (Air Temp @ 2m and Mean Radiant Temp) for a specific intervention.
        """
        base_temp = env_features.get('base_temp', 44.0)
        matrix_entry = COOLING_MATRIX.get(intervention.value, COOLING_MATRIX["shade_structure"])
        mrt_delta = matrix_entry['mrt_delta'][2] # Mean MRT delta (-15°C for shade sails)
        
        if self.model is not None:
            canopy = env_features.get('canopy_density', 0.1)
            albedo = env_features.get('surface_albedo', 0.2)
            aspect = env_features.get('aspect_ratio', 1.0)
            humidity = env_features.get('humidity', 30.0)
            wind = env_features.get('wind_speed', 2.0)
            
            int_tree = 1.0 if intervention == InterventionType.tree_canopy else 0.0
            int_shade = 1.0 if intervention == InterventionType.shade_structure else 0.0
            int_pave = 1.0 if intervention == InterventionType.cool_pavement else 0.0
            int_mist = 1.0 if intervention == InterventionType.misting else 0.0
            
            inputs = np.array([[canopy, albedo, aspect, humidity, wind, base_temp, 
                                int_tree, int_shade, int_pave, int_mist]], dtype=np.float32)
            try:
                preds = self.model.predict(inputs)
                air_delta = float(preds[0])
            except Exception:
                air_delta = self._get_empirical_cooling(intervention, env_features)
        else:
            air_delta = self._get_empirical_cooling(intervention, env_features)
            
        return CoolingDelta(delta_t_air=round(air_delta, 2), delta_t_mrt=round(mrt_delta, 1))

    def evaluate_intervention(self, intervention: InterventionType, env_features: Dict[str, float]) -> Dict[str, Any]:
        """
        Returns full evaluation including projected 2m temperature.
        """
        cooling_delta = self.predict(intervention, env_features)
        base_temp = env_features.get('base_temp', 44.5)
        projected_temp = base_temp + cooling_delta.delta_t_air
        
        return {
            "cooling_delta": cooling_delta,
            "projected_temp_2m": round(projected_temp, 2)
        }
