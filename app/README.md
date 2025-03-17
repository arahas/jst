# ZIP Code API Documentation

A RESTful API for accessing ZIP code boundaries and demographics data.

## Base URL
```
http://0.0.0.0:8000
```

## Endpoints

### 1. Get ZIP Code Data
Retrieve geographic and demographic information for specified ZIP codes.

```
GET /zip-codes/
```

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| postal_codes | string | No | null | Comma-separated list of postal codes (e.g., '98004,98005,98006') |
| year | integer | No | null | Specific year for demographic data |
| include_demographics | boolean | No | false | Whether to include demographic information |
| include_geometry | boolean | No | true | Whether to include geographic boundary data |

#### Example Requests
```bash
# Get basic ZIP code data
GET /zip-codes/?postal_codes=98004

# Get ZIP code data with demographics for a specific year
GET /zip-codes/?postal_codes=98004,98005&include_demographics=true&year=2020

# Get ZIP code data with demographics for all available years
GET /zip-codes/?postal_codes=98004&include_demographics=true

# Get ZIP code data without geometry
GET /zip-codes/?postal_codes=98004&include_geometry=false
```

#### Example Response
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "postal_code": "98004",
        "lat": 47.6167,
        "long": -122.2,
        "demographics": [
          {
            "year": 2010,
            "population": 50000
          },
          {
            "year": 2020,
            "population": 52000
          }
        ]
      },
      "geometry": {
        // GeoJSON geometry object
      }
    }
  ]
}
```

### 2. Get Available Years
Retrieve a list of years for which demographic data is available.

```
GET /years/
```

#### Example Request
```bash
GET /years/
```

#### Example Response
```json
[2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020]
```

### 3. Get Available Effective Weeks
Retrieve a list of unique effective weeks from jurisdiction plans.

```
GET /effective-weeks/
```

#### Example Request
```bash
GET /effective-weeks/
```

#### Example Response
```json
["2023-01", "2023-02", "2023-03", "2023-04", "2023-05"]
```

### 4. Get Statistics
Retrieve statistical information about ZIP codes and demographics data.

```
GET /stats/
```

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| year | integer | No | null | Specific year for detailed demographic statistics |

#### Example Requests
```bash
# Get general statistics
GET /stats/

# Get statistics including year-specific demographic data
GET /stats/?year=2020
```

#### Example Response (without year)
```json
{
  "total_zip_codes": 33791,
  "geographic_coverage": {
    "lat_range": {
      "min": 25.8418,
      "max": 48.9877
    },
    "long_range": {
      "min": -124.7844,
      "max": -67.0011
    }
  },
  "demographics_availability": {
    "total_years_available": 10,
    "year_range": {
      "earliest": 2010,
      "latest": 2020
    }
  }
}
```

#### Example Response (with year)
```json
{
  // ... basic stats as above ...
  "year_specific_stats": {
    "year": 2020,
    "coverage": {
      "zip_codes_with_demographics": 30000,
      "coverage_percentage": 88.78
    },
    "population_stats": {
      "total": 331002651,
      "average": 11033.42,
      "median": 8245.50,
      "std_deviation": 12567.89,
      "min": 0,
      "max": 112435,
      "quartiles": {
        "q1": 4125.25,
        "q2": 8245.50,
        "q3": 15678.75
      }
    }
  }
}
```

### 5. Get Node Coverage
Retrieve postal code coverage information for a delivery station.

```
GET /node/
```

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| delivery_station | string | Yes | - | Delivery station name to search for (partial matches supported) |
| effective_week | string | No | earliest available | Week in YYYY-WW format (e.g., '2025-01') |
| program_type | string | No | 'all' | Filter by program type: 'core', 'ssd', or 'all' |
| geometry | boolean | No | true | Include geometry data in the response |
| population | boolean | No | false | Include historical population data |
| recursive | boolean | No | false | If true, includes all delivery stations that cover the same postal codes as the main station |

#### Example Requests
```bash
# Get basic delivery station coverage
GET /node/?delivery_station=DAB5

# Get coverage with specific week and program type
GET /node/?delivery_station=DAB5&effective_week=2025-01&program_type=ssd

# Get coverage with population data
GET /node/?delivery_station=DAB5&population=true

# Get coverage with recursive search for all related delivery stations
GET /node/?delivery_station=DAB5&recursive=true
```

#### Example Response
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "postal_code": "98004",
        "delivery_station": "DAB5",
        "program_type": "ssd",
        "effective_week": "2025-01",
        "plan_identifier": "amzl_ssd_2025-01-01T00:00:00",
        "dw_update_datetime": "2025-01-01T00:00:00Z",
        "is_main_station": true,
        "lat": "47.6167",
        "long": "-122.2",
        "demographics": [
          {
            "year": 2020,
            "population": 52000
          }
        ]
      },
      "geometry": {
        // GeoJSON geometry object
      }
    }
  ],
  "metadata": {
    "delivery_station": "DAB5",
    "effective_week": "2025-01",
    "program_type": "ssd",
    "recursive": false,
    "total_postal_codes": 1,
    "total_delivery_stations": 1,
    "delivery_stations": ["DAB5"]
  }
}
```

### 6. Get Reverse Node Coverage
Retrieve delivery station coverage information for given postal codes.

```
GET /node-reverse/
```

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| postal_codes | string | Yes | - | Comma-separated list of postal codes (e.g., '98004,98005,98006') |
| effective_week | string | No | earliest available | Week in YYYY-WW format (e.g., '2025-01') |
| program_type | string | No | 'all' | Filter by program type: 'core', 'ssd', or 'all' |
| geometry | boolean | No | true | Include geometry data in the response |
| population | boolean | No | false | Include historical population data |

#### Example Requests
```bash
# Get delivery stations for specific postal codes
GET /node-reverse/?postal_codes=98004,98005

# Get coverage with specific week and program type
GET /node-reverse/?postal_codes=98004&effective_week=2025-01&program_type=ssd

# Get coverage with population data
GET /node-reverse/?postal_codes=98004,98005&population=true
```

#### Example Response
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "postal_code": "98004",
        "delivery_station": "DAB5",
        "program_type": "ssd",
        "effective_week": "2025-01",
        "plan_identifier": "amzl_ssd_2025-01-01T00:00:00",
        "dw_update_datetime": "2025-01-01T00:00:00Z",
        "lat": "47.6167",
        "long": "-122.2",
        "demographics": [
          {
            "year": 2020,
            "population": 52000
          }
        ]
      },
      "geometry": {
        // GeoJSON geometry object
      }
    }
  ],
  "metadata": {
    "postal_codes": ["98004"],
    "effective_week": "2025-01",
    "program_type": "ssd",
    "total_features": 1,
    "unique_delivery_stations": 1
  }
}
```

## Error Handling

The API returns standard HTTP status codes:

- 200: Success
- 400: Bad Request (invalid parameters)
- 404: Not Found
- 500: Internal Server Error

Error responses include a message describing the error:

```json
{
  "detail": "Error message description"
}
```

## Rate Limiting

Currently, there are no rate limits implemented on the API.

## Notes

- All geographic coordinates are in WGS84 (EPSG:4326) format
- Population data is based on census estimates
- Geographic boundaries are returned in GeoJSON format
- All timestamps are in UTC
- Demographic data might not be available for all ZIP codes or years 