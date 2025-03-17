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
                if include_demographics:
                    if year:
                        # If specific year requested, return single year data
                        demographics = db.query(models.ZipDemographics).filter(
                            models.ZipDemographics.postal_code == zip_code.postal_code,
                            models.ZipDemographics.year == year
                        ).first()
                        
                        if demographics:
                            properties["population"] = demographics.population
                            properties["year"] = demographics.year
                            print(f"  Added demographics for {zip_code.postal_code}: pop={demographics.population}")
                    else:
                        # If no year specified, return all years
                        demographics_all = db.query(models.ZipDemographics).filter(
                            models.ZipDemographics.postal_code == zip_code.postal_code
                        ).order_by(models.ZipDemographics.year).all()
                        
                        if demographics_all:
                            properties["demographics"] = [
                                {"year": d.year, "population": d.population}
                                for d in demographics_all
                            ]
                            print(f"  Added demographics for {zip_code.postal_code} for {len(demographics_all)} years")
                
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
    """Get comprehensive statistics about ZIP codes and demographics"""
    # Basic ZIP code stats
    stats = {
        "total_zip_codes": db.query(func.count(models.ZipCode.postal_code)).scalar(),
        "geographic_coverage": {
            "lat_range": {
                "min": float(db.query(func.min(models.ZipCode.lat)).scalar()),
                "max": float(db.query(func.max(models.ZipCode.lat)).scalar())
            },
            "long_range": {
                "min": float(db.query(func.min(models.ZipCode.long)).scalar()),
                "max": float(db.query(func.max(models.ZipCode.long)).scalar())
            }
        },
        "demographics_availability": {
            "total_years_available": db.query(models.ZipDemographics.year).distinct().count(),
            "year_range": {
                "earliest": db.query(func.min(models.ZipDemographics.year)).scalar(),
                "latest": db.query(func.max(models.ZipDemographics.year)).scalar()
            }
        }
    }
    
    if year:
        # Year-specific demographics stats
        demographics_stats = db.query(
            func.count(models.ZipDemographics.postal_code).label('count'),
            func.avg(models.ZipDemographics.population).label('avg_population'),
            func.min(models.ZipDemographics.population).label('min_population'),
            func.max(models.ZipDemographics.population).label('max_population'),
            func.stddev(models.ZipDemographics.population).label('stddev_population')
        ).filter(models.ZipDemographics.year == year).first()
        
        # Population distribution stats
        population_quartiles = db.query(
            func.percentile_cont(0.25).within_group(
                models.ZipDemographics.population.asc()
            ).label('q1'),
            func.percentile_cont(0.5).within_group(
                models.ZipDemographics.population.asc()
            ).label('median'),
            func.percentile_cont(0.75).within_group(
                models.ZipDemographics.population.asc()
            ).label('q3')
        ).filter(models.ZipDemographics.year == year).first()
        
        stats.update({
            "year_specific_stats": {
                "year": year,
                "coverage": {
                    "zip_codes_with_demographics": demographics_stats.count,
                    "coverage_percentage": round(demographics_stats.count / stats["total_zip_codes"] * 100, 2)
                },
                "population_stats": {
                    "total": int(demographics_stats.count * demographics_stats.avg_population),
                    "average": round(float(demographics_stats.avg_population), 2) if demographics_stats.avg_population else None,
                    "median": round(float(population_quartiles.median), 2) if population_quartiles.median else None,
                    "std_deviation": round(float(demographics_stats.stddev_population), 2) if demographics_stats.stddev_population else None,
                    "min": int(demographics_stats.min_population) if demographics_stats.min_population else None,
                    "max": int(demographics_stats.max_population) if demographics_stats.max_population else None,
                    "quartiles": {
                        "q1": round(float(population_quartiles.q1), 2) if population_quartiles.q1 else None,
                        "q2": round(float(population_quartiles.median), 2) if population_quartiles.median else None,
                        "q3": round(float(population_quartiles.q3), 2) if population_quartiles.q3 else None
                    }
                }
            }
        })
    
    return stats 

def get_node_data(
    db: Session,
    delivery_station: str,
    effective_week: str = None,
    program_type: str = 'all',
    include_geometry: bool = True,
    include_population: bool = False,
    recursive: bool = False
):
    """
    Get node (delivery station) coverage data with optional geometry and population data.
    Returns data in GeoJSON format.
    
    If recursive=True, also returns data for all delivery stations that cover the same postal codes
    as the main delivery station.
    """
    try:
        print(f"Starting get_node_data for delivery_station={delivery_station}, recursive={recursive}")
        
        # Get the minimum effective week if none provided
        if not effective_week:
            effective_week = db.query(func.min(models.JurisdictionPlan.effective_week)).scalar()
        
        print(f"Using effective_week={effective_week}")

        # Base query for jurisdiction plans
        query = db.query(models.JurisdictionPlan)
        
        # Filter by delivery station (including partial matches)
        if delivery_station.upper() != "ADDITIONAL-ZIPS":
            query = query.filter(models.JurisdictionPlan.delivery_station.ilike(f'%{delivery_station}%'))
            # Also exclude ADDITIONAL-ZIPS from partial matches
            query = query.filter(models.JurisdictionPlan.delivery_station != "ADDITIONAL-ZIPS")
        else:
            # If specifically requesting ADDITIONAL-ZIPS, exact match only
            query = query.filter(models.JurisdictionPlan.delivery_station == "ADDITIONAL-ZIPS")
        
        # Filter by effective week
        query = query.filter(models.JurisdictionPlan.effective_week == effective_week)
        
        # Filter by program type if not 'all'
        if program_type.lower() != 'all':
            query = query.filter(models.JurisdictionPlan.program_type == program_type.lower())

        # Get all matching jurisdiction plans
        plans = query.all()
        print(f"Found {len(plans)} plans for delivery station {delivery_station}")
        
        # Get postal codes for the main delivery station
        postal_codes = [plan.postal_code for plan in plans]
        print(f"Main delivery station covers {len(postal_codes)} postal codes")
        
        # If recursive mode is enabled, find all delivery stations that cover these postal codes
        all_delivery_stations = set([plan.delivery_station for plan in plans])
        if recursive and postal_codes:
            print(f"Recursive mode enabled. Finding all delivery stations covering the same postal codes...")
            
            # Query for all delivery stations that cover any of these postal codes
            recursive_query = db.query(models.JurisdictionPlan.delivery_station)\
                .filter(models.JurisdictionPlan.postal_code.in_(postal_codes))\
                .filter(models.JurisdictionPlan.effective_week == effective_week)\
                .filter(models.JurisdictionPlan.delivery_station != "ADDITIONAL-ZIPS")  # Exclude the catch-all category
            
            # Apply program type filter if specified
            if program_type.lower() != 'all':
                recursive_query = recursive_query.filter(models.JurisdictionPlan.program_type == program_type.lower())
            
            # Get unique delivery stations
            recursive_stations = set([row[0] for row in recursive_query.distinct().all()])
            
            # Remove the main delivery station from the set
            recursive_stations = recursive_stations - all_delivery_stations
            
            print(f"Found {len(recursive_stations)} additional delivery stations covering the same postal codes")
            
            # Get plans for these additional delivery stations
            if recursive_stations:
                additional_query = db.query(models.JurisdictionPlan)\
                    .filter(models.JurisdictionPlan.delivery_station.in_(recursive_stations))\
                    .filter(models.JurisdictionPlan.effective_week == effective_week)
                
                if program_type.lower() != 'all':
                    additional_query = additional_query.filter(models.JurisdictionPlan.program_type == program_type.lower())
                
                additional_plans = additional_query.all()
                print(f"Retrieved {len(additional_plans)} additional plans")
                
                # Add these plans to our main plans list
                plans.extend(additional_plans)
                
                # Update the set of all delivery stations
                all_delivery_stations.update(recursive_stations)
            
            print(f"Total plans after recursive search: {len(plans)}")
            print(f"Total unique delivery stations: {len(all_delivery_stations)}")
        
        # Get all postal codes from all plans
        all_postal_codes = set([plan.postal_code for plan in plans])
        print(f"Total unique postal codes: {len(all_postal_codes)}")
        
        # Create features list for GeoJSON
        features = []
        
        # Get all zip codes data for the postal codes
        zip_codes = {}
        if all_postal_codes:
            zip_codes_query = db.query(models.ZipCode).filter(
                models.ZipCode.postal_code.in_(all_postal_codes)
            )
            zip_codes = {zc.postal_code: zc for zc in zip_codes_query.all()}
            print(f"Retrieved ZIP code data for {len(zip_codes)} postal codes")
        
        # Get population data if requested
        populations = {}
        if include_population and all_postal_codes:
            pop_query = db.query(models.ZipDemographics).filter(
                models.ZipDemographics.postal_code.in_(all_postal_codes)
            ).order_by(models.ZipDemographics.year)
            
            for pop in pop_query.all():
                if pop.postal_code not in populations:
                    populations[pop.postal_code] = []
                populations[pop.postal_code].append({
                    "year": pop.year,
                    "population": pop.population
                })
            
            print(f"Retrieved population data for {len(populations)} postal codes")

        # Process each jurisdiction plan
        for plan in plans:
            properties = {
                "postal_code": plan.postal_code,
                "delivery_station": plan.delivery_station,
                "program_type": plan.program_type,
                "effective_week": plan.effective_week,
                "plan_identifier": plan.plan_identifier,
                "dw_update_datetime": plan.dw_update_datetime,
                "is_main_station": plan.delivery_station in [ds for ds in all_delivery_stations if ds.lower().find(delivery_station.lower()) >= 0]
            }
            
            # Add zip code data if available
            if plan.postal_code in zip_codes:
                zip_code = zip_codes[plan.postal_code]
                properties.update({
                    "lat": zip_code.lat,
                    "long": zip_code.long
                })
            
            # Add population data if requested and available
            if include_population and plan.postal_code in populations:
                properties["demographics"] = populations[plan.postal_code]

            feature = {
                "type": "Feature",
                "properties": properties
            }

            # Add geometry if requested and available
            if include_geometry and plan.postal_code in zip_codes:
                zip_code = zip_codes[plan.postal_code]
                if zip_code.geometry is not None:
                    try:
                        geojson_result = db.execute(
                            text("SELECT ST_AsGeoJSON(geometry) FROM zip_codes WHERE postal_code = :postal_code"),
                            {"postal_code": plan.postal_code}
                        ).scalar()
                        
                        if geojson_result:
                            feature["geometry"] = json.loads(geojson_result)
                    except Exception as e:
                        print(f"Error converting geometry for postal code {plan.postal_code}: {e}")
                        feature["geometry"] = None

            features.append(feature)

        # Create metadata
        metadata = {
            "delivery_station": delivery_station,
            "effective_week": effective_week,
            "program_type": program_type,
            "recursive": recursive,
            "total_postal_codes": len(all_postal_codes),
            "total_delivery_stations": len(all_delivery_stations),
            "delivery_stations": list(all_delivery_stations)
        }
        
        print(f"Returning {len(features)} features with {len(all_delivery_stations)} delivery stations")

        # Create and return FeatureCollection with metadata
        return {
            "type": "FeatureCollection",
            "features": features,
            "metadata": metadata
        }
    except Exception as e:
        print(f"Error in get_node_data: {e}")
        raise 

def get_node_reverse_data(
    db: Session,
    postal_codes: list[str],
    effective_week: str = None,
    program_type: str = 'all',
    include_geometry: bool = True,
    include_population: bool = False
):
    """
    Get delivery station coverage data for given postal codes with optional geometry and population data.
    Returns data in GeoJSON format.
    """
    try:
        # Get the minimum effective week if none provided
        if not effective_week:
            effective_week = db.query(func.min(models.JurisdictionPlan.effective_week)).scalar()

        # Base query for jurisdiction plans
        query = db.query(models.JurisdictionPlan)
        
        # Filter by postal codes
        postal_codes = [str(code).strip() for code in postal_codes]
        query = query.filter(models.JurisdictionPlan.postal_code.in_(postal_codes))
        
        # Filter by effective week
        query = query.filter(models.JurisdictionPlan.effective_week == effective_week)
        
        # Filter by program type if not 'all'
        if program_type.lower() != 'all':
            query = query.filter(models.JurisdictionPlan.program_type == program_type.lower())

        # Get all matching jurisdiction plans
        plans = query.all()
        
        # Get all zip codes data for the postal codes
        zip_codes = {}
        if postal_codes:
            zip_codes_query = db.query(models.ZipCode).filter(
                models.ZipCode.postal_code.in_(postal_codes)
            )
            zip_codes = {zc.postal_code: zc for zc in zip_codes_query.all()}
        
        # Get population data if requested
        populations = {}
        if include_population:
            pop_query = db.query(models.ZipDemographics).filter(
                models.ZipDemographics.postal_code.in_(postal_codes)
            ).order_by(models.ZipDemographics.year)
            
            for pop in pop_query.all():
                if pop.postal_code not in populations:
                    populations[pop.postal_code] = []
                populations[pop.postal_code].append({
                    "year": pop.year,
                    "population": pop.population
                })

        # Create features list for GeoJSON
        features = []
        
        # Process each jurisdiction plan
        for plan in plans:
            properties = {
                "postal_code": plan.postal_code,
                "delivery_station": plan.delivery_station,
                "program_type": plan.program_type,
                "effective_week": plan.effective_week,
                "plan_identifier": plan.plan_identifier,
                "dw_update_datetime": plan.dw_update_datetime
            }
            
            # Add zip code data if available
            if plan.postal_code in zip_codes:
                zip_code = zip_codes[plan.postal_code]
                properties.update({
                    "lat": zip_code.lat,
                    "long": zip_code.long
                })
            
            # Add population data if requested and available
            if include_population and plan.postal_code in populations:
                properties["demographics"] = populations[plan.postal_code]

            feature = {
                "type": "Feature",
                "properties": properties
            }

            # Add geometry if requested and available
            if include_geometry and plan.postal_code in zip_codes:
                zip_code = zip_codes[plan.postal_code]
                if zip_code.geometry is not None:
                    try:
                        geojson_result = db.execute(
                            text("SELECT ST_AsGeoJSON(geometry) FROM zip_codes WHERE postal_code = :postal_code"),
                            {"postal_code": plan.postal_code}
                        ).scalar()
                        
                        if geojson_result:
                            feature["geometry"] = json.loads(geojson_result)
                    except Exception as e:
                        print(f"Error converting geometry for postal code {plan.postal_code}: {e}")
                        feature["geometry"] = None

            features.append(feature)

        # Create metadata
        metadata = {
            "postal_codes": postal_codes,
            "effective_week": effective_week,
            "program_type": program_type,
            "total_features": len(features),
            "unique_delivery_stations": len(set(plan.delivery_station for plan in plans))
        }

        # Create and return FeatureCollection with metadata
        return {
            "type": "FeatureCollection",
            "features": features,
            "metadata": metadata
        }
    except Exception as e:
        print(f"Error in get_node_reverse_data: {e}")
        raise 

def get_effective_weeks(db: Session):
    """
    Retrieve all unique effective weeks from the jurisdiction_plans table.
    Returns them sorted in ascending order.
    """
    # Query for unique effective weeks
    result = db.query(models.JurisdictionPlan.effective_week)\
        .distinct()\
        .order_by(models.JurisdictionPlan.effective_week)\
        .all()
    
    # Extract the effective week values from the result tuples
    weeks = [row[0] for row in result]
    
    return weeks 