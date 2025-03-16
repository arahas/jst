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
    postal_codes: Optional[List[str]] = Query(None),
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
    
    if postal_codes:
        # Debug: Print each postal code and its type
        for code in postal_codes:
            print(f"  Processing postal code: {code} (type: {type(code)})")
    
    return crud.get_zip_codes(
        db=db,
        postal_codes=postal_codes,
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