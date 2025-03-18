# Backend Logic Documentation

## Overview

This document explains the design and functionality of the backend system for the ZIP code API. The system is built using FastAPI and SQLAlchemy to provide access to geographical and demographic data for ZIP codes, with special features for delivery station coverage analysis.

## Files and Their Functions

### database.py

This file handles the database connection configuration:

- Uses SQLAlchemy to connect to a PostgreSQL database
- Loads connection parameters from environment variables (with fallbacks)
- Configures connection pooling with QueuePool
- Creates session handling functionality via `SessionLocal`
- Provides a dependency function `get_db()` for FastAPI to inject database sessions

### models.py

Defines SQLAlchemy ORM models that map to database tables:

1. **ZipCode**
   - Represents ZIP code geographical boundaries
   - Contains fields for postal code, latitude, longitude
   - Uses GeoAlchemy2 to handle the PostGIS geometry column (MULTIPOLYGON)
   - Includes a GiST index on the geometry column for spatial queries

2. **ZipDemographics**
   - Contains demographic information for ZIP codes
   - Includes fields for postal code, year, and population
   - Primary key is a composite of postal_code and year
   - Indexed on the year field for efficient filtering

3. **JurisdictionPlan**
   - Maps postal codes to delivery stations
   - Contains fields for plan_identifier, program_type, postal_code, delivery_station, effective_week
   - Composite primary key using plan_identifier, postal_code, effective_week

### schemas.py

Defines Pydantic models for request/response validation and serialization:

1. **ZipCodeBase**
   - Basic ZIP code data model (postal_code, lat, long)

2. **ZipDemographicsBase**
   - Basic demographics model (postal_code, year, population)

3. **GeoJSONResponse**
   - Response model for GeoJSON formatted data
   - Includes custom JSON encoders for GeoJSON features

4. **ZipCodeQuery**
   - Input model for ZIP code query parameters
   - Handles optional filtering by postal codes and year
   - Controls inclusion of demographics and geometry data

5. **NodeResponse**
   - Response model for delivery station data
   - Extends GeoJSON with metadata
   - Includes JSON encoders for datetime serialization

### main.py

The main application file that defines FastAPI routes/endpoints:

1. **GET /**
   - Simple welcome message

2. **GET /zip-codes/**
   - Returns ZIP code data in GeoJSON format
   - Supports filtering by postal codes and year
   - Optional inclusion of demographics and geometry
   - Parameters are validated and passed to the CRUD layer

3. **GET /years/**
   - Returns list of available years in demographics data

4. **GET /effective-weeks/**
   - Returns list of unique effective weeks from jurisdiction plans

5. **GET /stats/**
   - Returns statistics about ZIP codes and demographics data
   - Can be filtered by year

6. **GET /node/**
   - Returns postal code coverage for a delivery station
   - Includes sophisticated recursive functionality (explained below)

7. **GET /node-reverse/**
   - Returns delivery station coverage for given postal codes
   - Reverse lookup from postal codes to stations

### crud.py

Contains all database operations and business logic:

1. **get_zip_codes()**
   - Retrieves ZIP code data with optional demographics
   - Converts database results to GeoJSON format
   - Handles PostGIS geometry conversions

2. **get_available_years()**
   - Returns distinct years from demographics data

3. **get_zip_code_stats()**
   - Provides statistics on ZIP code data including population metrics

4. **get_node_data()**
   - Complex function that retrieves postal code coverage for delivery stations
   - Implements the recursive functionality (detailed below)

5. **get_node_reverse_data()**
   - Performs the reverse lookup from postal codes to delivery stations

6. **get_effective_weeks()**
   - Returns distinct effective weeks from jurisdiction plans

## Sophisticated Logic: The Recursive Flag

The `/node/` endpoint includes a `recursive` parameter that implements advanced network analysis functionality.

### How the Recursive Flag Works:

1. **Normal Operation (recursive=False):**
   - When a delivery station is queried, the system finds all postal codes associated with that station for the specified effective week
   - Returns these postal codes with their geographical boundaries and optionally, population data

2. **Recursive Operation (recursive=True):**
   - First performs the normal lookup to find all postal codes for the requested delivery station
   - Then finds all *other* delivery stations that cover *any* of these same postal codes
   - Returns a combined dataset that includes:
     - All postal codes for the primary station
     - All postal codes for any related stations that share coverage with the primary station
     - Metadata indicating which delivery station owns each postal code
     - A flag marking whether each result belongs to the primary station

This recursive functionality enables network analysis by revealing:
- Overlapping service areas between delivery stations
- Complete coverage maps for regions served by multiple stations
- Relationships between stations based on shared territory

### Implementation Details:

1. The process begins by finding all postal codes associated with the primary delivery station
2. A second query then searches for all other delivery stations that cover any of these postal codes
3. For each of these additional stations, their complete coverage is added to the result set
4. The metadata includes:
   - Total unique postal codes across all stations
   - Total number of delivery stations in the network
   - A flag for each feature indicating if it belongs to the primary station

## How the Components Work Together

1. **Request Flow:**
   - Client sends request to a FastAPI endpoint
   - FastAPI validates parameters using Pydantic models
   - Dependency injection provides a database session
   - Endpoint handler calls appropriate CRUD function
   - CRUD function performs database operations and business logic
   - Results are formatted according to response schemas
   - FastAPI serializes the response

2. **Data Handling:**
   - SQLAlchemy ORM models map database tables to Python objects
   - GeoAlchemy2 handles PostGIS spatial data types
   - Geometry data is converted from PostGIS format to GeoJSON
   - Pydantic models ensure consistent API contracts

3. **Spatial Analysis:**
   - Geographical data is stored as PostGIS MULTIPOLYGON objects
   - Spatial queries use PostgreSQL's spatial functions via SQL text queries
   - GeoJSON is used as the standard format for all geographic data responses

## Conclusion

This backend system provides a comprehensive API for accessing ZIP code data with sophisticated network analysis capabilities. The architecture follows modern best practices with clear separation between database models, business logic, and API endpoints.

The recursive functionality in the `/node/` endpoint demonstrates advanced integration between relational and geographical data, enabling complex network analysis for delivery station coverage. 