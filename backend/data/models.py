"""
SQLAlchemy Models with PostGIS.
"""
from sqlalchemy import Column, String, Float, Integer, ForeignKey
from geoalchemy2 import Geometry
from .database import Base

class GridCellModel(Base):
    __tablename__ = "grid_cells"
    
    id = Column(String, primary_key=True, index=True)
    geom = Column(Geometry('POLYGON', srid=4326))
    temp_2m = Column(Float)
    canopy_cover = Column(Float)
    albedo = Column(Float)
    svi = Column(Float)
    population_density = Column(Float)

class PlanModel(Base):
    __tablename__ = "plans"
    
    id = Column(String, primary_key=True)
    budget = Column(Float)
    
class InterventionModel(Base):
    __tablename__ = "interventions"
    
    id = Column(String, primary_key=True)
    plan_id = Column(String, ForeignKey("plans.id"))
    cell_id = Column(String, ForeignKey("grid_cells.id"))
    type = Column(String)
    cost = Column(Float)
