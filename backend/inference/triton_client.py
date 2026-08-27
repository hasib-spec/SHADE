import requests
import json
import time
from typing import Dict, Any, List

class TritonClient:
    """
    Client for Triton Inference Server via HTTP with retry and fallback handling.
    """
    
    def __init__(self, url: str = "http://localhost:8000"):
        self.url = url
        
    def infer(self, model_name: str, inputs: List[Dict[str, Any]], retries: int = 3) -> Dict[str, Any]:
        """
        Run inference on Triton server.
        """
        endpoint = f"{self.url}/v2/models/{model_name}/infer"
        payload = {
            "inputs": inputs
        }
        
        for attempt in range(retries):
            try:
                response = requests.post(endpoint, json=payload, timeout=5.0)
                response.raise_for_status()
                return response.json()
            except requests.exceptions.RequestException as e:
                if attempt == retries - 1:
                    print(f"Failed to connect to Triton server after {retries} attempts: {e}")
                    raise
                time.sleep(1.0)
        return {}
