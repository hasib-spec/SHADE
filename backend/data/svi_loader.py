import csv
import json
from typing import Dict, Any, Optional

class SVILoader:
    """
    Utility for loading Social Vulnerability Index (SVI) data.
    """
    def __init__(self, data_path: Optional[str] = None):
        self.data_path = data_path
        self.svi_data = {}

    def load_csv(self, file_path: str):
        """Loads SVI data from a CSV file."""
        try:
            with open(file_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    tract_id = row.get("Tract", row.get("tract_id"))
                    svi_val = row.get("SVI", row.get("svi_score"))
                    if tract_id and svi_val is not None:
                        self.svi_data[tract_id] = float(svi_val)
        except Exception as e:
            print(f"Error loading SVI CSV: {e}")

    def load_geojson(self, file_path: str):
        """Loads SVI data from a GeoJSON file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for feature in data.get("features", []):
                    props = feature.get("properties", {})
                    tract_id = props.get("Tract", props.get("tract_id"))
                    svi_val = props.get("SVI", props.get("svi_score"))
                    if tract_id and svi_val is not None:
                        self.svi_data[tract_id] = float(svi_val)
        except Exception as e:
            print(f"Error loading SVI GeoJSON: {e}")

    def get_svi_for_location(self, lat: float, lon: float) -> float:
        """
        Mock spatial lookup for SVI given a lat/lon.
        In a real scenario, this would use spatial indexing (e.g., R-tree or PostGIS)
        to find the intersecting census tract and return its SVI.
        """
        # Returns a mock value based on coordinates if real spatial lookup is missing
        return 0.5
