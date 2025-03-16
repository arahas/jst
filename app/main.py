from fastapi import FastAPI, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from . import crud, models, schemas
from .database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI app
app = FastAPI(
    title="ZIP Code API",
    description="API for accessing ZIP code boundaries and demographics data",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the ZIP Code API"}

@app.get("/zip-codes/", response_model=schemas.GeoJSONResponse)
def get_zip_codes(
    postal_codes: Optional[str] = Query(None, description="Comma-separated list of postal codes (e.g., '98004,98005,98006')"),
    year: Optional[int] = None,
    include_demographics: bool = False,
    include_geometry: bool = True,
    db: Session = Depends(get_db)
):
    """
    Get ZIP code data with optional demographics and geometry.
    Returns data in GeoJSON format.
    """
    # Debug: Print received parameters
    print(f"Received request with parameters:")
    print(f"  postal_codes: {postal_codes}")
    print(f"  year: {year}")
    print(f"  include_demographics: {include_demographics}")
    print(f"  include_geometry: {include_geometry}")
    
    # Parse comma-separated postal codes
    postal_codes_list = None
    if postal_codes:
        postal_codes_list = [code.strip() for code in postal_codes.split(',')]
        # Debug: Print each postal code and its type
        for code in postal_codes_list:
            print(f"  Processing postal code: {code} (type: {type(code)})")
    
    return crud.get_zip_codes(
        db=db,
        postal_codes=postal_codes_list,
        year=year,
        include_demographics=include_demographics,
        include_geometry=include_geometry
    )

@app.get("/years/", response_model=List[int])
def get_available_years(db: Session = Depends(get_db)):
    """
    Get list of available years in demographics data
    """
    return crud.get_available_years(db)

@app.get("/stats/")
def get_stats(
    year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get basic statistics about ZIP codes and demographics
    """
    return crud.get_zip_code_stats(db, year)

@app.get("/node/", response_model=schemas.NodeResponse)
def get_node(
    delivery_station: str = Query(..., description="Delivery station name to search for"),
    effective_week: Optional[str] = Query(None, description="Week in YYYY-WW format (e.g., '2025-01'). If not provided, uses earliest available week."),
    program_type: str = Query('all', description="Filter by program type: 'core', 'ssd', or 'all'"),
    geometry: bool = Query(True, description="Include geometry data in the response"),
    population: bool = Query(False, description="Include historical population data"),
    db: Session = Depends(get_db)
):
    """
    Get postal code coverage for a delivery station with optional geometry and population data.
    Returns data in GeoJSON format with additional metadata.
    """
    return crud.get_node_data(
        db=db,
        delivery_station=delivery_station,
        effective_week=effective_week,
        program_type=program_type,
        include_geometry=geometry,
        include_population=population
    )

@app.get("/node-reverse/", response_model=schemas.NodeResponse)
def get_node_reverse(
    postal_codes: str = Query(..., description="Comma-separated list of postal codes (e.g., '98004,98005,98006')"),
    effective_week: Optional[str] = Query(None, description="Week in YYYY-WW format (e.g., '2025-01'). If not provided, uses earliest available week."),
    program_type: str = Query('all', description="Filter by program type: 'core', 'ssd', or 'all'"),
    geometry: bool = Query(True, description="Include geometry data in the response"),
    population: bool = Query(False, description="Include historical population data"),
    db: Session = Depends(get_db)
):
    """
    Get delivery station coverage for given postal codes with optional geometry and population data.
    Returns data in GeoJSON format with additional metadata.
    """
    # Parse comma-separated postal codes
    postal_codes_list = [code.strip() for code in postal_codes.split(',')]
    
    return crud.get_node_reverse_data(
        db=db,
        postal_codes=postal_codes_list,
        effective_week=effective_week,
        program_type=program_type,
        include_geometry=geometry,
        include_population=population
    ) 