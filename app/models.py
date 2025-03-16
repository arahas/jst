from sqlalchemy import Column, Integer, String, Float, Index, MetaData
from geoalchemy2 import Geometry
from .database import Base

metadata = MetaData(schema='public')

class ZipCode(Base):
    __tablename__ = "zip_codes"
    
    # Combine schema and index into a single __table_args__
    __table_args__ = (
        Index('idx_zip_codes_geometry', 'geometry', postgresql_using='gist'),
        {'schema': 'public'}
    )
    
    postal_code = Column(String, primary_key=True)
    lat = Column(String)
    long = Column(String)
    geometry = Column(Geometry('MULTIPOLYGON', srid=4326))

class ZipDemographics(Base):
    __tablename__ = "zip_demographics"
    
    # Combine schema and index into a single __table_args__
    __table_args__ = (
        Index('idx_zip_demographics_year', 'year'),
        {'schema': 'public'}
    )
    
    postal_code = Column(String, primary_key=True)
    year = Column(Integer, primary_key=True)
    population = Column(Float) 