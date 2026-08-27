"""
Export Schemas
"""
from pydantic import BaseModel
from typing import Any, Dict

class GeoJSONWorkOrder(BaseModel):
    type: str = "FeatureCollection"
    features: list

class SMSAlert(BaseModel):
    phone_number: str
    message: str

class ExportRequest(BaseModel):
    plan_id: str
    format: str # geojson or sms
