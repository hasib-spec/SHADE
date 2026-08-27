from fastapi import APIRouter
from typing import Dict, Any, List, Union
from backend.exporters.geojson import generate_geojson_workorder
from backend.exporters.sms import generate_sms_alerts
from backend.data.synthetic_grid import generate_synthetic_grid
from backend.analytics.forecast import generate_district_forecast

router = APIRouter(prefix="/api/export", tags=["export"])

@router.post("/geojson", response_model=Dict[str, Any])
def export_geojson(allocation_plan: Dict[str, Any]):
    """
    Returns downloadable GeoJSON FeatureCollection work order ready for QGIS/ArcGIS.
    """
    cells = generate_synthetic_grid("Maryvale", hour=15.0)
    return generate_geojson_workorder(allocation_plan, cells)

@router.post("/sms", response_model=List[Dict[str, str]])
def export_sms(request_payload: Dict[str, Any] = None):
    """
    Returns bilingual (English + Spanish) targeted SMS alert broadcast drafts for vulnerable residents.
    """
    cells = generate_synthetic_grid("Maryvale", hour=15.0)[:5]
    forecast = generate_district_forecast("Maryvale", base_temp=42.0, hours_ahead=24)
    target_demographic = (request_payload or {}).get("target_demographic", "elderly")
    return generate_sms_alerts(cells, forecast, target_demographic)
