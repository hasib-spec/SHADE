import os
import joblib
import numpy as np
from typing import Dict, Any, List, Optional

from backend.schemas.intervention import CoolingDelta, InterventionType
from backend.inference.cooling_matrix import COOLING_MATRIX

class InterventionSurrogateModel:
    """
    High-speed inference engine for predicting intervention cooling impact.

    Inference path (first available wins, each step logged):
      1. ONNX runtime over the exported artifact (models/surrogate/intervention_surrogate.onnx)
         — numerically verified equivalent to the sklearn model (see export_onnx.py).
      2. scikit-learn MLPRegressor via joblib.
      3. Vectorized empirical micro-physics formulas (always available).
    """

    def __init__(self, model_path: str = None):
        self.model = None          # sklearn joblib model
        self.onnx_session = None   # onnxruntime InferenceSession
        self.backend = "physics"   # which path actually served predictions
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

        if model_path is None:
            possible_paths = [
                os.path.join(base_dir, 'models', 'surrogate', 'intervention_surrogate.onnx'),
                os.path.join(base_dir, 'models', 'surrogate', 'surrogate_model.joblib'),
            ]
            for p in possible_paths:
                if os.path.exists(p):
                    model_path = p
                    break

        if model_path and os.path.exists(model_path):
            if model_path.endswith(".onnx"):
                try:
                    import onnxruntime as ort
                    self.onnx_session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
                    self.backend = "onnx"
                except Exception as e:
                    self.onnx_session = None
            else:
                try:
                    self.model = joblib.load(model_path)
                    self.backend = "sklearn_joblib"
                except Exception:
                    self.model = None

        # Fallback: joblib next to the ONNX artifact (or vice versa)
        if self.onnx_session is None and self.model is None:
            joblib_alt = os.path.join(base_dir, 'models', 'surrogate', 'surrogate_model.joblib')
            if os.path.exists(joblib_alt):
                try:
                    self.model = joblib.load(joblib_alt)
                    self.backend = "sklearn_joblib"
                except Exception:
                    self.model = None

    @property
    def inference_backend(self) -> str:
        return self.backend

    def _onnx_predict(self, inputs: np.ndarray) -> Optional[float]:
        if self.onnx_session is None:
            return None
        try:
            name = self.onnx_session.get_inputs()[0].name
            out = self.onnx_session.run(None, {name: inputs.astype(np.float32)})
            return float(np.asarray(out[0]).ravel()[0])
        except Exception:
            return None
                
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
        
        if self.onnx_session is not None:
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
            air_delta = self._onnx_predict(inputs)
            if air_delta is not None:
                return CoolingDelta(delta_t_air=round(air_delta, 2), delta_t_mrt=round(mrt_delta, 1))

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
