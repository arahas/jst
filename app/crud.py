from sqlalchemy.orm import Session
from sqlalchemy import func, text
from . import models
from geoalchemy2.shape import to_shape
from geojson import Feature, FeatureCollection
import json

def get_zip_codes(
    db: Session,
    postal_codes: list[str] = None,
    year: int = None,
    include_demographics: bool = False,
    include_geometry: bool = True
):
    """
    Get ZIP code data with optional demographics and geometry.
    Returns data in GeoJSON format.
    """
    try:
        # Base query for zip codes
        query = db.query(models.ZipCode)
        
        # Filter by postal codes if provided
        if postal_codes:
            # Convert all postal codes to strings and strip any whitespace
            postal_codes = [str(code).strip() for code in postal_codes]
            print(f"Searching for postal codes: {postal_codes}")  # Debug print
            
            # Debug: Check each postal code individually
            for code in postal_codes:
                result = db.query(models.ZipCode).filter(models.ZipCode.postal_code == code).first()
                print(f"Individual query for {code}: {'Found' if result else 'Not found'}")
            
            # Apply the IN filter
            query = query.filter(models.ZipCode.postal_code.in_(postal_codes))
            
            # Debug: Print the SQL query
            print(f"SQL Query: {query}")
        
        # Get all matching zip codes
        zip_codes = query.all()
        print(f"Found {len(zip_codes)} matching ZIP codes")  # Debug print
        
        # Debug: Print raw data from database
        for zc in zip_codes:
            print(f"Processing ZIP: {zc.postal_code}")
            print(f"  Lat: {zc.lat}")
            print(f"  Long: {zc.long}")
            print(f"  Has geometry: {zc.geometry is not None}")
            
            if zc.geometry is not None:
                # Check if geometry is valid
                valid_check = db.execute(
                    text("SELECT ST_IsValid(geometry::geometry) FROM zip_codes WHERE postal_code = :postal_code"),
                    {"postal_code": zc.postal_code}
                ).scalar()
                print(f"  Geometry is valid: {valid_check}")
                
                # Debug: Check raw geometry
                raw_geom = db.execute(
                    text("SELECT ST_AsText(geometry) FROM zip_codes WHERE postal_code = :postal_code"),
                    {"postal_code": zc.postal_code}
                ).scalar()
                print(f"  Raw geometry type: {raw_geom[:50] if raw_geom else 'None'}...")
        
        # Create features list for GeoJSON
        features = []
        for zip_code in zip_codes:
            try:
                # Prepare properties
                properties = {
                    "postal_code": zip_code.postal_code,
                    "lat": zip_code.lat,
                    "long": zip_code.long,
                }
                
                # Add demographics if requested
                if include_demographics and year:
                    demographics = db.query(models.ZipDemographics).filter(
                        models.ZipDemographics.postal_code == zip_code.postal_code,
                        models.ZipDemographics.year == year
                    ).first()
                    
                    if demographics:
                        properties["population"] = demographics.population
                        properties["year"] = demographics.year
                        print(f"  Added demographics for {zip_code.postal_code}: pop={demographics.population}")
                
                # Create feature
                feature = {
                    "type": "Feature",
                    "properties": properties,
                }
                
                # Add geometry if requested
                if include_geometry and zip_code.geometry is not None:
                    try:
                        # Get geometry directly as GeoJSON
                        result = db.execute(
                            text("""
                                SELECT ST_AsGeoJSON(geometry)
                                FROM zip_codes 
                                WHERE postal_code = :postal_code
                            """),
                            {"postal_code": zip_code.postal_code}
                        ).scalar()
                        
                        if result:
                            feature["geometry"] = json.loads(result)
                            print(f"  Successfully added geometry for {zip_code.postal_code}")
                        else:
                            print(f"  No geometry found for ZIP {zip_code.postal_code}")
                            feature["geometry"] = None
                            
                    except Exception as e:
                        print(f"  Error converting geometry for ZIP {zip_code.postal_code}: {e}")
                        feature["geometry"] = None
                
                features.append(feature)
                print(f"Successfully processed ZIP {zip_code.postal_code}")
            except Exception as e:
                print(f"Error processing ZIP {zip_code.postal_code}: {e}")
                continue
        
        print(f"Processed {len(features)} features")  # Debug print
        
        # Create and return FeatureCollection
        return {
            "type": "FeatureCollection",
            "features": features
        }
    except Exception as e:
        print(f"Error in get_zip_codes: {e}")
        raise

def get_available_years(db: Session):
    """Get list of available years in demographics data"""
    years = db.query(models.ZipDemographics.year)\
        .distinct()\
        .order_by(models.ZipDemographics.year)\
        .all()
    return [year[0] for year in years]

def get_zip_code_stats(db: Session, year: int = None):
    """Get basic statistics about ZIP codes and demographics"""
    stats = {
        "total_zip_codes": db.query(func.count(models.ZipCode.postal_code)).scalar(),
    }
    
    if year:
        demographics_stats = db.query(
            func.count(models.ZipDemographics.postal_code).label('count'),
            func.avg(models.ZipDemographics.population).label('avg_population'),
            func.min(models.ZipDemographics.population).label('min_population'),
            func.max(models.ZipDemographics.population).label('max_population')
        ).filter(models.ZipDemographics.year == year).first()
        
        stats.update({
            "year": year,
            "zip_codes_with_demographics": demographics_stats.count,
            "average_population": float(demographics_stats.avg_population) if demographics_stats.avg_population else None,
            "min_population": float(demographics_stats.min_population) if demographics_stats.min_population else None,
            "max_population": float(demographics_stats.max_population) if demographics_stats.max_population else None
        })
    
    return stats 