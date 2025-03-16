from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from geojson import Feature, FeatureCollection
from datetime import datetime

class ZipCodeBase(BaseModel):
    postal_code: str
    lat: str
    long: str

class ZipDemographicsBase(BaseModel):
    postal_code: str
    year: int
    population: float

class GeoJSONResponse(BaseModel):
    type: str = "FeatureCollection"
    features: List[Dict[str, Any]]

    class Config:
        json_encoders = {
            Feature: lambda f: f.__geo_interface__,
            FeatureCollection: lambda fc: fc.__geo_interface__
        }

class ZipCodeQuery(BaseModel):
    postal_codes: Optional[List[str]] = None
    year: Optional[int] = None
    include_demographics: bool = False
    include_geometry: bool = True

class NodeResponse(BaseModel):
    type: str = "FeatureCollection"
    features: List[Dict[str, Any]]
    metadata: Dict[str, Any]

    class Config:
        json_encoders = {
            Feature: lambda f: f.__geo_interface__,
            FeatureCollection: lambda fc: fc.__geo_interface__,
            datetime: lambda dt: dt.isoformat()
        } 